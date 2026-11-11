/**
 * Renderizador mínimo de markdown "editorial".
 * Suporta: parágrafos, "## " (h2), "### " (h3), "> " (citação),
 * "- " (listas) e **negrito** inline. Evita dependência de biblioteca
 * enquanto o volume de conteúdo é pequeno.
 */

export type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string };

export function parseBody(body: string): Block[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: "list", items: [...list] });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h3", text: line.slice(4) });
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", text: line.slice(3) });
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", text: line.slice(2) });
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }
    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

/** Quebra **negrito** em segmentos para renderização segura. */
export function renderInline(text: string): { bold: boolean; value: string }[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((chunk) => {
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return { bold: true, value: chunk.slice(2, -2) };
    }
    return { bold: false, value: chunk };
  });
}
