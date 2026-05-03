import { useAvisoEngagementCounts } from "@/hooks/useAvisoEngagement";
import { MessageSquare, SmilePlus } from "lucide-react";

export function AvisoEngagementSummary({ avisoId }: { avisoId: string }) {
  const { data } = useAvisoEngagementCounts([avisoId]);
  const c = data?.[avisoId];
  if (!c || (c.reactions === 0 && c.comments === 0)) {
    return <span className="text-xs text-muted-foreground">Sem reações</span>;
  }
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1"><SmilePlus className="w-3.5 h-3.5" /> {c.reactions}</span>
      <span className="inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {c.comments}</span>
    </div>
  );
}
