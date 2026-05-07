import { useAuth } from "@/contexts/AuthContext";
import { useHourContext } from "@/hooks/useHourContext";
import { CurioFalante } from "./CurioFalante";
import { FraseDoDia } from "./FraseDoDia";
import { StreakBadge } from "./StreakBadge";
import { ModoToggle } from "./ModoToggle";
import { BotaoOuvirResumo } from "./BotaoOuvirResumo";

interface HeaderSaudacaoProps {
  subtitle?: string;
  resumoTexto?: string;
}

const GREETINGS: Record<string, string> = {
  manha: "Bom dia",
  tarde: "Boa tarde",
  noite: "Boa noite",
  madrugada: "Boa madrugada",
};

export function HeaderSaudacao({ subtitle, resumoTexto }: HeaderSaudacaoProps) {
  const { profile } = useAuth();
  const ctx = useHourContext();
  const nome = profile?.nome?.split(" ")[0] ?? "time";
  const dia = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div className="space-y-3">
      <div className="rounded-2xl gradient-curio text-primary-foreground p-4 shadow-sm">
        <p className="text-xs opacity-90 capitalize">{dia}</p>
        <h1 className="text-2xl md:text-3xl font-bold">
          {GREETINGS[ctx]}, {nome}
        </h1>
        {subtitle && <p className="text-sm opacity-90 mt-0.5">{subtitle}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StreakBadge />
          <ModoToggle />
          {resumoTexto && <BotaoOuvirResumo texto={resumoTexto} />}
        </div>
      </div>
      <FraseDoDia />
      <CurioFalante />
    </div>
  );
}
