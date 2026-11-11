import type { Metadata } from "next";

import { Container } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { buildMetadata } from "@/lib/seo";
import { sports } from "@/lib/sports";
import { site } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Sobre e política editorial",
  description:
    "Quem faz o King's Sports, como apuramos, o que publicamos e como tratamos correções, opinião e dados de terceiros.",
  path: "/sobre",
});

const principles = [
  {
    title: "Nada sem apuração",
    body: "Notícia, placar, tabela e estatística só entram no ar com fonte identificável. Quando um dado não está confirmado, ele não é publicado — nem como estimativa.",
  },
  {
    title: "Opinião é separada",
    body: "Textos analíticos são assinados, datados e marcados como análise. A cobertura factual não recebe adjetivo de torcida.",
  },
  {
    title: "Correção visível",
    body: "Erro corrigido é registrado na própria matéria, com data e descrição do que mudou. Não apagamos histórico silenciosamente.",
  },
  {
    title: "Transparência sobre dados",
    body: "Resultados e tabelas indicam a competição, a temporada e a data da última atualização. Dados de terceiros são creditados.",
  },
];

export default function AboutPage() {
  return (
    <Container>
      <PageHeader
        section="/sobre"
        title="Sobre o King's Sports"
        description="Um portal esportivo independente, feito para quem quer entender o jogo — e o que acontece fora dele."
      />

      <div className="grid gap-12 py-10 sm:py-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="prose-article max-w-2xl">
          <h2>O que somos</h2>
          <p>
            {site.name} é uma publicação esportiva independente. Cobrimos competições, clubes,
            atletas e o contexto que costuma ficar de fora do placar: bastidores, mercado,
            formação e política do esporte.
          </p>
          <p>
            O portal nasceu em {site.foundingYear} como projeto próprio, sem vínculo com clubes,
            ligas ou agências de apostas. Isso define o que podemos publicar e como.
          </p>

          <h2>Como trabalhamos</h2>
          <ul>
            <li>Fonte primária sempre que existir: clube, federação, atleta ou documento.</li>
            <li>Rumor só aparece quando identificado como rumor e atribuído a quem o publicou.</li>
            <li>Nenhum número é estimado para preencher espaço na página.</li>
            <li>Conteúdo patrocinado, quando existir, será sinalizado de forma inequívoca.</li>
          </ul>

          <h2>Modalidades cobertas</h2>
          <p>
            Começamos por um conjunto enxuto e crescemos conforme a operação amadurece. A lista
            atual é: {sports.map((sport) => sport.name.toLowerCase()).join(", ")}.
          </p>

          <h2>Correções e direito de resposta</h2>
          <p>
            Erros devem ser reportados para{" "}
            <a href={`mailto:${site.editorialEmail}`}>{site.editorialEmail}</a>. Toda correção
            relevante é registrada na matéria. Pessoas citadas têm direito de resposta.
          </p>

          <h2>Publicidade e independência</h2>
          <p>
            A operação é financiada por publicidade e produtos próprios. Anunciantes não têm
            acesso à pauta, ao texto ou à edição antes da publicação.
          </p>
        </div>

        <aside className="space-y-3">
          {principles.map((principle) => (
            <div
              key={principle.title}
              className="rounded-card border border-line-soft bg-ink-850/60 shadow-card p-4"
            >
              <h2 className="font-display text-sm font-bold text-flood-300">{principle.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-mist-400">{principle.body}</p>
            </div>
          ))}

          <div className="rounded-card border border-line-soft bg-ink-900/60 p-4">
            <h2 className="font-display text-sm font-bold text-mist-100">Contato</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-mist-400">
              Redação:{" "}
              <a
                href={`mailto:${site.editorialEmail}`}
                className="text-flood-300 underline decoration-flood-500/40 underline-offset-4"
              >
                {site.editorialEmail}
              </a>
            </p>
            <p className="mt-2 text-xs text-mist-600">
              Endereço público planejado: {site.url.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
