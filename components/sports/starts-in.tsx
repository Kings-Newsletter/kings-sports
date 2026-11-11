"use client";

import { useEffect, useState } from "react";

import { startsInText } from "@/lib/format";

/** Contagem até o início, recalculada a cada 30 s no navegador. */
export function StartsIn({ kickoff, initial }: { kickoff: string; initial: string }) {
  const [text, setText] = useState(initial);

  useEffect(() => {
    const update = () => setText(startsInText(kickoff));
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [kickoff]);

  return <span suppressHydrationWarning>{text}</span>;
}
