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

  return (
    <div>
      <div>
        <h1 className="text-[26px] font-bold leading-tight text-foreground sm:text-3xl">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="capitalize">{formattedDate}</span>
        </p>
      </div>
    </div>
  );
}
