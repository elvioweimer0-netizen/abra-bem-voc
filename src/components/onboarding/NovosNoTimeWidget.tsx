import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useUnitOnboardings } from "@/hooks/useOnboarding";
import { Users } from "lucide-react";

export function NovosNoTimeWidget() {
  const { profile } = useAuth();
  const unitId = (profile as any)?.unit_id;
  const { data } = useUnitOnboardings(unitId);
  if (!data?.length) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" /> Novos no time
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((r: any) => {
          const pct = r.total_modules > 0 ? Math.round((r.completed_modules / r.total_modules) * 100) : 0;
          return (
            <Card key={r.id}>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-semibold truncate">{r.profile?.nome}</p>
                <Progress value={pct} className="h-2" />
                <p className="text-xs text-muted-foreground">{r.completed_modules}/{r.total_modules} cápsulas · {r.status === "atrasado" ? "atrasado" : "em andamento"}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
