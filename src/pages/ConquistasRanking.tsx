import { useState } from "react";
import { useAchievementsRanking } from "@/hooks/useAchievements";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ConquistasRanking() {
  const [unitId, setUnitId] = useState<string | undefined>();
  const { data, isLoading } = useAchievementsRanking(unitId);
  const { data: units } = useAccessibleUnits();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6 text-amber-500" /> Ranking de Conquistas</h1>
          <p className="text-sm text-muted-foreground">Top 10 do mês</p>
        </div>
        {units && units.length > 0 && (
          <Select value={unitId ?? "all"} onValueChange={(v) => setUnitId(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Todas as unidades" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card className="divide-y">
        {isLoading && <div className="p-6 text-center text-sm text-muted-foreground">Carregando...</div>}
        {!isLoading && (data ?? []).length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma conquista desbloqueada neste mês ainda.</div>
        )}
        {(data ?? []).map((row, idx) => (
          <div key={row.user_id} className="p-3 flex items-center gap-3">
            <div className="w-8 text-center font-bold text-muted-foreground">{idx + 1}</div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={(row.profile as any)?.foto_url} />
              <AvatarFallback>{((row.profile as any)?.nome ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{(row.profile as any)?.nome ?? "Usuário"}</p>
              <p className="text-xs text-muted-foreground">{(row.profile as any)?.unidade ?? ""}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{row.count}</p>
              <p className="text-[10px] text-muted-foreground">conquistas</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
