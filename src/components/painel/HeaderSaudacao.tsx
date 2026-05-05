import { useAuth } from "@/contexts/AuthContext";

interface HeaderSaudacaoProps {
  subtitle?: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getContext() {
  const day = new Date().getDay();
  if (day === 1) return "RAC 9:30 hoje";
  if (day === 5) return "Review 11h hoje";
  return "Operação normal";
}

export function HeaderSaudacao({ subtitle }: HeaderSaudacaoProps) {
  const { profile } = useAuth();
  const nome = profile?.nome?.split(" ")[0] ?? "time";
  const dia = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground capitalize">{dia} · {getContext()}</p>
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
        {getGreeting()}, {nome}
      </h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
