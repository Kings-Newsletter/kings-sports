import { SportIcon } from "@/components/ui/sport-icon";

/** Ordem em que as bolas se revezam no quique. */
const BALLS = ["futebol", "basquete", "volei", "tenis"] as const;

/**
 * Bola quicando: a cada batida no chão troca de modalidade (futebol, basquete,
 * vôlei, tênis), girando no ar, com a sombra que encolhe quando ela sobe.
 * `size` é o diâmetro da bola em px; a altura total é ~1.9× isso.
 */
export function SportsLoader({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`sports-loader ${className}`}
      style={{ "--ball": `${size}px` } as React.CSSProperties}
    >
      <span className="sports-loader__shadow" />
      <span className="sports-loader__ball">
        <span className="sports-loader__spin">
          {BALLS.map((sport, i) => (
            <SportIcon
              key={sport}
              sport={sport}
              className="sports-loader__icon"
              style={{ animationDelay: `${i * 1.4 - 0.7}s` }}
              strokeWidth={2}
            />
          ))}
        </span>
      </span>
    </span>
  );
}

/** Bola de futebol girando, para caber no lugar de um ícone pequeno. */
export function Spinner({ className = "size-3.5" }: { className?: string }) {
  return <SportIcon sport="futebol" className={`shrink-0 animate-spin [animation-duration:900ms] ${className}`} />;
}
