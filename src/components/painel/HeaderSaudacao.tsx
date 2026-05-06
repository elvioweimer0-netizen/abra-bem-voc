import { useAuth } from "@/contexts/AuthContext";
import { CurioFalante } from "./CurioFalante";
import { FraseDoDia } from "./FraseDoDia";
import { StreakBadge } from "./StreakBadge";
import { ModoToggle } from "./ModoToggle";
import { BotaoOuvirResumo } from "./BotaoOuvirResumo";

interface HeaderSaudacaoProps {
  subtitle?: string;
  resumoTexto?: string;
}

function capitalizeWords(s: string) {
  return s.replace(/(^|\s|-)([a-zà-ú])/g, (_, p1, p2) => p1 + p2.toUpperCase());
}

export function HeaderSaudacao({ subtitle, resumoTexto }: HeaderSaudacaoProps) {
  const { profile } = useAuth();
  const nome = profile?.nome?.split(" ")[0] ?? "time";
  const today = new Date();
  const dataExtenso = capitalizeWords(
    today.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).replace(/ de /g, " de ")
  );

  return (
    <div className="space-y-3">
      <div className="animate-home-brand min-w-0">
        <h1 className="text-2xl sm:text-[28px] font-bold leading-tight text-foreground">
          ✨ Seja bem-vindo, {nome}, ao{" "}
          <span
            className="brand-script inline-block text-[32px] leading-tight sm:text-[38px]"
            style={{ color: "#B63533" }}
          >
            Conecta Curió
          </span>
        </h1>
        <p className="mt-2 text-[15px] leading-snug text-muted-foreground">
          Comunicação, equipe e operação em um só lugar.
        </p>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground/75">
          {dataExtenso}
        </p>
        {subtitle && (
          <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
        )}
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
