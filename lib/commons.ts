import "server-only";

/**
 * Fotos de atletas e pilotos do Wikimedia Commons.
 *
 * O Wikidata liga cada pessoa à sua foto principal no Commons (propriedade
 * P18). Procuramos as pessoas pelo nome, filtrando pela profissão do esporte,
 * e buscamos no Commons a miniatura, o autor e a licença: as fotos são livres,
 * mas exigem crédito, que as páginas mostram.
 *
 * Nomes ambíguos ("Pedro") só valem quando o time confere. Sem certeza, não
 * há foto do Commons e a página usa a do provedor de dados.
 */

export type CommonsPhoto = {
  /** Miniatura pronta para exibir */
  src: string;
  /** Arquivo original (para SVG, o vetor em vez da miniatura) */
  original?: string;
  /** Página do arquivo no Commons */
  page: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
};

export type PersonQuery = { name: string; sport: string; team?: string };

export const USER_AGENT = "sports-portal-photo-lookup/1.0";
const WEEK = 7 * 24 * 3600;

/** Profissões no Wikidata por esporte do portal. */
const OCCUPATIONS: Record<string, string[]> = {
  futebol: ["Q937857"], // futebolista
  basquete: ["Q3665646"], // basquetebolista
  "futebol-americano": ["Q19204627"], // jogador de futebol americano
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Flamengo" confere com "Clube de Regatas do Flamengo"; "Los Angeles Lakers" com "Lakers". */
function teamMatches(team: string, labels: string[]) {
  const wanted = normalize(team);
  if (!wanted) return false;
  return labels.some((label) => {
    const have = normalize(label);
    return have.includes(wanted) || wanted.includes(have);
  });
}

type Candidate = { item: string; image: string; occupations: Set<string>; teams: string[] };

async function queryWikidata(names: string[]): Promise<Map<string, Candidate[]>> {
  const occupations = [...new Set(Object.values(OCCUPATIONS).flat())];
  const values = names.flatMap((name) => ["en", "pt", "mul"].map((lang) => `${JSON.stringify(name)}@${lang}`)).join(" ");
  const query = `SELECT ?l ?item ?image (GROUP_CONCAT(DISTINCT ?occ; separator="|") AS ?occs) (GROUP_CONCAT(DISTINCT ?teamLabel; separator="|") AS ?teams) WHERE {
  VALUES ?l { ${values} }
  VALUES ?occ { ${occupations.map((id) => `wd:${id}`).join(" ")} }
  ?item rdfs:label ?l; wdt:P106 ?occ; wdt:P18 ?image.
  OPTIONAL { ?item wdt:P54 ?team. ?team rdfs:label ?teamLabel. FILTER(LANG(?teamLabel) IN ("en", "pt")) }
} GROUP BY ?l ?item ?image`;

  const result = new Map<string, Candidate[]>();
  try {
    const response = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
      next: { revalidate: WEEK },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.warn(`[commons] Wikidata respondeu ${response.status}`);
      return result;
    }
    const data = (await response.json()) as {
      results: { bindings: Record<string, { value: string } | undefined>[] };
    };
    for (const row of data.results.bindings) {
      const name = row.l?.value;
      const item = row.item?.value;
      const image = row.image?.value;
      if (!name || !item || !image) continue;
      const list = result.get(name) ?? [];
      const occs = (row.occs?.value ?? "").split("|").map((uri) => uri.split("/").pop() ?? "");
      const existing = list.find((candidate) => candidate.item === item);
      if (existing) {
        occs.forEach((occ) => existing.occupations.add(occ));
        continue;
      }
      list.push({
        item,
        image,
        occupations: new Set(occs),
        teams: (row.teams?.value ?? "").split("|").filter(Boolean),
      });
      result.set(name, list);
    }
  } catch (error) {
    // Sem resposta do Wikidata: as páginas seguem com as fotos do provedor.
    console.warn("[commons] Wikidata falhou:", error instanceof Error ? error.message : error);
  }
  return result;
}

/** Escolhe a pessoa certa entre os homônimos, ou nenhuma se não houver certeza. */
function pick(person: PersonQuery, candidates: Candidate[]): Candidate | undefined {
  const allowed = OCCUPATIONS[person.sport];
  const sameSport = allowed ? candidates.filter((c) => allowed.some((occ) => c.occupations.has(occ))) : [];
  if (sameSport.length === 0) return undefined;

  if (person.team) {
    const byTeam = sameSport.filter((c) => teamMatches(person.team!, c.teams));
    if (byTeam.length === 1) return byTeam[0];
  }
  // Nome de uma palavra só ("Pedro", "Mikael") é ambíguo demais sem o time.
  if (!person.name.trim().includes(" ")) return undefined;
  // Um único atleta com esse nome no esporte: é ele. Vários homônimos sem o
  // time conferindo: melhor nenhuma foto do que a foto de outra pessoa.
  return sameSport.length === 1 ? sameSport[0] : undefined;
}

function stripHtml(value?: string) {
  return value
    ?.replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

type ImageInfo = {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: string } | undefined>;
};

/** Miniatura, original, autor e licença de arquivos do Commons, pelo nome. */
export async function commonsInfo(files: string[], width: number): Promise<Map<string, CommonsPhoto>> {
  const result = new Map<string, CommonsPhoto>();
  for (let index = 0; index < files.length; index += 50) {
    const titles = files.slice(index, index + 50).map((file) => `File:${file}`).join("|");
    try {
      const url =
        "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo" +
        `&iiprop=url|extmetadata&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl&iiurlwidth=${width}` +
        `&titles=${encodeURIComponent(titles)}`;
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: WEEK },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        console.warn(`[commons] Commons respondeu ${response.status}`);
        continue;
      }
      const data = (await response.json()) as {
        query?: { normalized?: { from: string; to: string }[]; pages?: { title: string; imageinfo?: ImageInfo[] }[] };
      };
      const original = new Map((data.query?.normalized ?? []).map((n) => [n.to, n.from]));
      for (const page of data.query?.pages ?? []) {
        const info = page.imageinfo?.[0];
        if (!info?.thumburl) continue;
        const title = original.get(page.title) ?? page.title;
        const meta = info.extmetadata ?? {};
        result.set(title.replace(/^File:/, ""), {
          src: info.thumburl,
          original: info.url,
          page: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
          author: stripHtml(meta.Artist?.value),
          license: stripHtml(meta.LicenseShortName?.value),
          licenseUrl: meta.LicenseUrl?.value,
        });
      }
    } catch (error) {
      // Lote sem resposta: essas pessoas ficam com a foto do provedor.
      console.warn("[commons] Commons falhou:", error instanceof Error ? error.message : error);
    }
  }
  return result;
}

/**
 * Fotos do Commons para uma lista de pessoas, pelo nome. Quem não for
 * encontrado com segurança fica fora do mapa.
 */
export async function getCommonsPhotos(people: PersonQuery[], width = 500): Promise<Map<string, CommonsPhoto>> {
  const unique = [...new Map(people.filter((p) => p.name.trim()).map((p) => [p.name, p])).values()];
  const photos = new Map<string, CommonsPhoto>();
  if (unique.length === 0) return photos;

  // Lotes de 40 nomes: a consulta vai na URL e fica em cache por uma semana.
  const candidates = new Map<string, Candidate[]>();
  for (let index = 0; index < unique.length; index += 40) {
    const batch = await queryWikidata(unique.slice(index, index + 40).map((p) => p.name));
    batch.forEach((list, name) => candidates.set(name, list));
  }

  const chosen = new Map<string, string>(); // nome -> arquivo
  for (const person of unique) {
    const match = pick(person, candidates.get(person.name) ?? []);
    if (match) chosen.set(person.name, decodeURIComponent(match.image.split("/Special:FilePath/").pop() ?? ""));
  }

  const info = await commonsInfo([...new Set(chosen.values())], width);
  chosen.forEach((file, name) => {
    const photo = info.get(file) ?? info.get(file.replace(/_/g, " "));
    if (photo) photos.set(name, photo);
  });
  return photos;
}

export async function getCommonsPhoto(person: PersonQuery, width = 500): Promise<CommonsPhoto | undefined> {
  return (await getCommonsPhotos([person], width)).get(person.name);
}
