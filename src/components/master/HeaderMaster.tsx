import { useAuth } from "@/contexts/AuthContext";
import { useHourContext } from "@/hooks/useHourContext";

const DIA_CONTEXT: Record<number, string> = {
  1: "RAC às 9:30",
  3: "Pulse às 14h",
  5: "Review às 11h",
};

export function HeaderMaster() {
  const { profile } = useAuth();
  const period = useHourContext();
  const greeting = period === "manha" ? "Bom dia" : period === "tarde" ? "Boa tarde" : "Boa noite";
  const now = new Date();
  const dia = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const ctx = DIA_CONTEXT[now.getDay()];
  const firstName = profile?.nome?.split(" ")[0] ?? "chefe";

  return (
    <header className="space-y-1">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
        {greeting}, {firstName}
      </h1>
      <p className="text-sm text-muted-foreground capitalize">
        {dia}
        {ctx ? ` · ${ctx}` : ""}
      </p>
    </header>
  );
}
