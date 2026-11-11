import type { SVGProps } from "react";

/**
 * Ícones de modalidade em traço único (24×24, stroke = currentColor), no lugar
 * dos emojis: herdam a cor do texto e ficam nítidos em qualquer tamanho.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function Football(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7.2 3.4 2.5-1.3 4h-4.2l-1.3-4Z" />
      <path d="M12 3v4.2M15.4 9.7l4.3-1.5M14.1 13.7l2.7 3.9M9.9 13.7l-2.7 3.9M8.6 9.7 4.3 8.2" />
    </svg>
  );
}

function Basketball(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3v18" />
      <path d="M5.6 5.6c2.3 2.3 2.3 10.5 0 12.8M18.4 5.6c-2.3 2.3-2.3 10.5 0 12.8" />
    </svg>
  );
}

function Racing(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h13l-2 4 2 4H5" />
      <path d="M9 4v8M13 4v8M5 8h13" />
    </svg>
  );
}

function AmericanFootball(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 19.5C3 13 6.5 6.4 12 5c3.2-.8 5.8-.6 7.5-.5.1 1.7.3 4.3-.5 7.5-1.4 5.5-8 9-14.5 7.5Z" />
      <path d="m9.5 14.5 5-5M10.5 11l2.5 2.5M12 9.5l2.5 2.5M8.5 13l2.5 2.5" />
    </svg>
  );
}

function Tennis(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.2 6.1A9 9 0 0 1 5.2 17.9M18.8 6.1a9 9 0 0 0 0 11.8" />
    </svg>
  );
}

function Volleyball(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c0 5 2.5 9 7.8 10.5M12 12c-4.3 2.4-6.2 5.4-6 8M12 12c-4-2.5-8.2-2-9 0" />
    </svg>
  );
}

function Fight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 11V7.5A3.5 3.5 0 0 1 10.5 4h3A3.5 3.5 0 0 1 17 7.5v5a5.5 5.5 0 0 1-5.5 5.5H10a3 3 0 0 1-3-3v-1" />
      <path d="M7 11h4a2 2 0 0 1 0 4H7M8 18v2.5h7V18" />
    </svg>
  );
}

function Gamepad(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 8h10a4 4 0 0 1 4 4v2.5a2.5 2.5 0 0 1-4.6 1.4L15 14H9l-1.4 1.9A2.5 2.5 0 0 1 3 14.5V12a4 4 0 0 1 4-4Z" />
      <path d="M8 10.5v3M6.5 12h3M15.5 11h.01M17.5 13h.01" />
    </svg>
  );
}

function Medal(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m8 3 4 6 4-6" />
      <circle cx="12" cy="15" r="6" />
      <path d="m12 12.5.8 1.6 1.7.2-1.3 1.2.4 1.7-1.6-.9-1.6.9.4-1.7-1.3-1.2 1.7-.2Z" />
    </svg>
  );
}

function Trophy(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" />
    </svg>
  );
}

function Grid(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  );
}

const ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  futebol: Football,
  futsal: Football,
  basquete: Basketball,
  automobilismo: Racing,
  "futebol-americano": AmericanFootball,
  tenis: Tennis,
  volei: Volleyball,
  mma: Fight,
  esports: Gamepad,
  olimpiadas: Medal,
  todos: Grid,
};

export function SportIcon({ sport, className = "size-4", ...props }: { sport?: string } & IconProps) {
  const Icon = (sport && ICONS[sport]) || Trophy;
  return <Icon className={className} {...props} />;
}
