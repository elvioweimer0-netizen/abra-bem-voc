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
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground text-sm">
          {profile?.unidade} · <span className="capitalize">{formattedDate}</span>
        </p>
      </div>
    </div>
  );
}
