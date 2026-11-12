import type { ReactNode, SVGProps } from "react";

export function KingsLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <rect x="0.488" width="47.024" height="47.02" rx="7.35" fill="#2563eb" />
      <path
        d="M37.57 19.832c0 .078 0 .164-.02.242l-1.82 7.27a.82.82 0 0 1-.792.629l-10.903.054H13.121a.83.83 0 0 1-.805-.629L10.5 20.105c-.023-.085-.023-.175-.023-.253a1.73 1.73 0 0 1-1.211-1.649c0-.96.78-1.742 1.738-1.742.96 0 1.742.781 1.742 1.742 0 .54-.242 1.024-.64 1.344l2.28 2.289a3.08 3.08 0 0 0 2.18.902c.97 0 1.883-.46 2.47-1.222l3.734-4.957a1.7 1.7 0 0 1-.508-1.223c0-.957.781-1.738 1.738-1.738.96 0 1.742.78 1.742 1.738 0 .465-.187.883-.484 1.203l3.71 4.965a3.1 3.1 0 0 0 2.47 1.234 3.06 3.06 0 0 0 2.18-.902l2.288-2.29A1.744 1.744 0 0 1 37 16.449a1.744 1.744 0 0 1 1.738 1.743 1.77 1.77 0 0 1-1.168 1.641m-2.015 10.781a.83.83 0 0 0-.825-.824H13.363a.833.833 0 0 0-.828.824v1.985c0 .449.375.824.828.824H34.73c.45 0 .825-.375.825-.824Z"
        fill="#fffffd"
      />
    </svg>
  );
}

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 12h13m0 0-5-5m5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex size-2 ${className}`} aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-live-400 opacity-70" />
      <span className="relative inline-flex size-2 rounded-full bg-live-500" />
    </span>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}
