"use client";

import { useEffect, useState } from "react";

import { liveClockText, type LiveClockInput } from "@/lib/live-clock";

/**
 * Relógio ao vivo que corre entre uma coleta e outra. O texto inicial vem do
 * servidor (mesmo valor na hidratação) e passa a ser recalculado a cada segundo.
 */
export function LiveClock({
  input,
  initial,
  className,
  title,
}: {
  input: LiveClockInput;
  initial: string;
  className?: string;
  title?: string;
}) {
  const [text, setText] = useState(initial);

  useEffect(() => {
    const update = () => setText(liveClockText(input));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [input.kickoff, input.updatedAt, input.clock, input.status, input.sport, input.kind]);

  return (
    <span className={className} title={title} suppressHydrationWarning>
      {text}
    </span>
  );
}
