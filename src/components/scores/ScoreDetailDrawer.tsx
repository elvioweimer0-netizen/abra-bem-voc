import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScoreHeroCard } from "./ScoreHeroCard";
import { ScoreTrendChart } from "./ScoreTrendChart";
import { ScoreDimensionCard } from "./ScoreDimensionCard";
import { ScoreEthicsDisclaimer } from "./ScoreEthicsDisclaimer";
import { useScoresHistoryFor, useScoreDimensions } from "@/hooks/useManagerScore";

export function ScoreDetailDrawer({ open, onClose, userId, name }: { open: boolean; onClose: () => void; userId?: string; name?: string }) {
  const { data: history = [] } = useScoresHistoryFor(userId, 6);
  const { data: dimensions = [] } = useScoreDimensions();
  const current = history[history.length - 1];
  const previous = history[history.length - 2];
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{name ?? "Detalhe do Score"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <ScoreEthicsDisclaimer />
          <ScoreHeroCard current={current} previous={previous} />
          <ScoreTrendChart scores={history} />
          {current && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dimensions.map((d) => (
                <ScoreDimensionCard key={d.id} dimension={d} entry={current.dimension_breakdown?.[d.code]} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
