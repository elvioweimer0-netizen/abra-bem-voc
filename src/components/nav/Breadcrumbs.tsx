import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  comunicacao: "Comunicação",
  "meu-dia": "Meu Dia",
  "minha-equipe": "Minha Equipe",
  "minha-loja": "Minha Loja",
  unidades: "Unidades",
  unidade: "Unidade",
  cultura: "Cultura",
  mais: "Mais",
  admin: "Admin",
  "importar-colaboradores": "Importar Colaboradores",
};

function pretty(seg: string) {
  return LABELS[seg] ?? seg.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function Breadcrumbs({ trail }: { trail?: { label: string; to?: string }[] }) {
  const { pathname } = useLocation();
  const items =
    trail ??
    pathname
      .split("/")
      .filter(Boolean)
      .map((seg, i, arr) => ({
        label: pretty(seg),
        to: i === arr.length - 1 ? undefined : "/" + arr.slice(0, i + 1).join("/"),
      }));

  if (!items.length) return null;

  return (
    <nav aria-label="breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
      <Link to="/" className="hover:text-foreground">Painel</Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {it.to ? (
            <Link to={it.to} className="hover:text-foreground">{it.label}</Link>
          ) : (
            <span className="text-foreground font-medium">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
