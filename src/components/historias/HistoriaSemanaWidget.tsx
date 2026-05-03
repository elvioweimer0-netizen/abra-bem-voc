import { useStoryOfTheWeek } from "@/hooks/useCurioStories";
import { HistoriaCard } from "./HistoriaCard";
import { Sparkles } from "lucide-react";

export function HistoriaSemanaWidget() {
  const { data: story, isLoading } = useStoryOfTheWeek();
  if (isLoading || !story) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" /> História da semana
      </h2>
      <HistoriaCard story={story} compact />
    </div>
  );
}
