import { useAuth } from "@/contexts/AuthContext";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function HeaderHome() {
  const { profile } = useAuth();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const firstName = profile?.nome?.split(" ")[0] ?? "";
  const loginCount = profile?.login_count ?? 0;
  const isFirstAccesses = loginCount <= 10;

  return (
    <div className="animate-home-brand min-w-0">
      <h1 className={`${isFirstAccesses ? "text-[28px] sm:text-[32px]" : "text-2xl sm:text-[28px]"} font-bold leading-tight text-foreground`}>
        {isFirstAccesses ? "✨ Seja bem-vindo" : getGreeting()}, {firstName}, ao{" "}
        <span className="brand-script text-gradient-curio inline-block text-[32px] leading-tight sm:text-[38px]">
          Conecta Curió
        </span>
      </h1>
      {isFirstAccesses && (
        <p className="mt-2 text-[15px] leading-snug text-muted-foreground">
          Comunicação, equipe e operação em um só lugar.
        </p>
      )}
      <p className={`${isFirstAccesses ? "mt-1 text-[13px] text-muted-foreground/75" : "mt-1 text-[13px] text-muted-foreground"} leading-snug`}>
        <span className="capitalize">{formattedDate}</span>
      </p>
    </div>
  );
}
