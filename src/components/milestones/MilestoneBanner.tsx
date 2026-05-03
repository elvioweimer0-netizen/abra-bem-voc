import { Sparkles } from "lucide-react";
import { useMyMilestoneToday } from "@/hooks/useMyMilestoneToday";
import { milestoneLabel, milestoneYears } from "@/hooks/useUpcomingMilestones";

export function MilestoneBanner() {
  const { data } = useMyMilestoneToday();
  if (!data) return null;
  const years = milestoneYears(data.milestone_type);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/40 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 p-6 text-amber-950 shadow-lg dark:border-amber-500/30">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_50%)]" />
      <div className="relative flex items-center gap-4">
        <div className="rounded-full bg-white/30 p-3 backdrop-blur">
          <Sparkles className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold">🎉 Hoje é o seu dia!</h2>
          <p className="text-sm font-medium">
            {years
              ? `Você completa ${years} ${years === 1 ? "ano" : "anos"} no Curió. Parabéns pela jornada!`
              : milestoneLabel(data.milestone_type)}
          </p>
        </div>
      </div>
    </div>
  );
}
