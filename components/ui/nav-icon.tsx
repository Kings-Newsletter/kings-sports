import {
  BarChart3,
  BookOpenText,
  CalendarDays,
  Car,
  Flag,
  Info,
  ListOrdered,
  Newspaper,
  PenLine,
  Repeat2,
  Shield,
  Shirt,
  Trophy,
  Tv,
  type LucideIcon,
} from "lucide-react";

/** Ícone de cada seção do site, pelo endereço. */
export const NAV_ICONS: Record<string, LucideIcon> = {
  "/": Tv,
  "/resultados": ListOrdered,
  "/classificacoes": Trophy,
  "/noticias": Newspaper,
  "/times": Shield,
  "/selecoes": Flag,
  "/jogadores": Shirt,
  "/pilotos": Car,
  "/calendario": CalendarDays,
  "/competicoes": BookOpenText,
  "/estatisticas": BarChart3,
  "/transferencias": Repeat2,
  "/analises": PenLine,
  "/sobre": Info,
};

export function NavIcon({ href, className = "size-4" }: { href: string; className?: string }) {
  const Icon = NAV_ICONS[href];
  return Icon ? <Icon className={className} aria-hidden="true" strokeWidth={1.9} /> : null;
}
