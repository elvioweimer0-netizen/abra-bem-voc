import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CommitmentStatusBadge } from "./CommitmentStatusBadge";
import type { Commitment } from "@/hooks/useWeeklyCommitments";

type Props = {
  authorName: string;
  unitName?: string | null;
  commitment: Commitment;
};

export function CommitmentCard({ authorName, unitName, commitment }: Props) {
  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{authorName}</p>
            {unitName && <p className="truncate text-xs text-muted-foreground">{unitName}</p>}
          </div>
          <CommitmentStatusBadge status={commitment.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>{commitment.commitment_text}</p>
        {commitment.evidencia && (
          <p className="text-xs text-muted-foreground border-t pt-1">{commitment.evidencia}</p>
        )}
      </CardContent>
    </Card>
  );
}
