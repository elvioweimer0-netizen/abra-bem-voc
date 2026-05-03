import { useMemo, useState } from "react";
import { useScoresRanking, useScoreDimensions } from "@/hooks/useManagerScore";
import { ScoreEthicsDisclaimer } from "@/components/scores/ScoreEthicsDisclaimer";
import { ScoreMiniBars } from "@/components/scores/ScoreMiniBars";
import { ScoreDetailDrawer } from "@/components/scores/ScoreDetailDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ScoresRanking() {
  const now = new Date();
  const defaultMonth = now.getUTCMonth() === 0 ? 12 : now.getUTCMonth();
  const defaultYear = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const { data: rows = [], isLoading } = useScoresRanking(year, month);
  const { data: dimensions = [] } = useScoreDimensions();
  const dimOrder = useMemo(() => dimensions.map((d) => d.code), [dimensions]);
  const [drawer, setDrawer] = useState<{ userId: string; name: string } | null>(null);

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearOptions = [defaultYear, defaultYear - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking de Gerentes</h1>
        <p className="text-sm text-muted-foreground">Score composto mensal por gerente.</p>
      </div>
      <ScoreEthicsDisclaimer />

      <div className="flex items-center gap-2">
        <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => <SelectItem key={m} value={String(m)}>{String(m).padStart(2, "0")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhum score calculado para esse período.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r: any, idx: number) => (
            <Card key={r.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setDrawer({ userId: r.user_id, name: r.profile?.nome ?? "Gerente" })}>
              <CardContent className="p-4 flex items-center gap-4">
                <span className="w-8 text-center text-lg font-bold text-muted-foreground">{idx + 1}º</span>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={r.profile?.foto_url ?? undefined} />
                  <AvatarFallback>{(r.profile?.nome ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{r.profile?.nome ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.profile?.unidade ?? "—"}</p>
                </div>
                <ScoreMiniBars breakdown={r.dimension_breakdown ?? {}} dimensionOrder={dimOrder} />
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{Number(r.final_score).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">/ 100</p>
                </div>
                <Button variant="ghost" size="sm">Ver</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ScoreDetailDrawer open={!!drawer} onClose={() => setDrawer(null)} userId={drawer?.userId} name={drawer?.name} />
    </div>
  );
}
