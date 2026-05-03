import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAvisoReactions, REACTION_EMOJIS, type ReactionEmoji } from "@/hooks/useAvisoEngagement";
import { cn } from "@/lib/utils";

export function AvisoReactionBar({ avisoId, compact = false }: { avisoId: string; compact?: boolean }) {
  const { data, toggle, isLoading } = useAvisoReactions(avisoId);
  if (isLoading || !data) {
    return <div className="h-9" />;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const count = data.counts[emoji] ?? 0;
        const mine = data.mine.has(emoji);
        return (
          <Tooltip key={emoji}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle.mutate(emoji as ReactionEmoji); }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-colors",
                  compact ? "h-8" : "h-9",
                  mine ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-accent",
                )}
              >
                <span className="text-base leading-none">{emoji}</span>
                {count > 0 && <span className="text-xs font-medium">{count}</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent>{mine ? `Você reagiu com ${emoji}` : `Reagir com ${emoji}`}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
