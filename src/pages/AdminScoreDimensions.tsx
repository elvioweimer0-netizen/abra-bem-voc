import { useEffect, useMemo, useState } from "react";
import { useScoreDimensions, useUpdateDimension, useTriggerCalculation } from "@/hooks/useManagerScore";
import { ScoreEthicsDisclaimer } from "@/components/scores/ScoreEthicsDisclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminScoreDimensions() {
  const { data: dims = [], isLoading } = useScoreDimensions();
  const update = useUpdateDimension();
  const trigger = useTriggerCalculation();

  const [draft, setDraft] = useState<Record<string, { weight: number; active: boolean }>>({});

  useEffect(() => {
    if (dims.length === 0) return;
    setDraft((prev) => Object.keys(prev).length > 0 ? prev : Object.fromEntries(dims.map((d) => [d.id, { weight: Number(d.weight), active: d.active }])));
  }, [dims]);

  const totalActive = useMemo(
    () => Object.values(draft).filter((d) => d.active).reduce((s, d) => s + (Number(d.weight) || 0), 0),
    [draft]
  );

  const sumOk = Math.abs(totalActive - 100) < 0.01;

  const save = async () => {
    if (!sumOk) {
      toast.error("Soma dos pesos ativos deve ser exatamente 100.");
      return;
    }
    try {
      for (const d of dims) {
        const v = draft[d.id];
        if (!v) continue;
        if (Number(v.weight) !== Number(d.weight) || v.active !== d.active) {
          await update.mutateAsync({ id: d.id, weight: v.weight, active: v.active });
        }
      }
      toast.success("Dimensões atualizadas. Próximo cálculo aplicará os novos pesos.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  const recalc = async () => {
    try {
      await trigger.mutateAsync({});
      toast.success("Cálculo disparado. Confira os scores em alguns instantes.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao disparar cálculo");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dimensões do Score</h1>
        <p className="text-sm text-muted-foreground">Pesos e ativação. Mudanças entram no próximo cálculo mensal.</p>
      </div>
      <ScoreEthicsDisclaimer />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Soma dos pesos ativos</span>
            <Badge variant={sumOk ? "default" : "destructive"}>{totalActive.toFixed(2)} / 100</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {isLoading ? (
        <p>Carregando…</p>
      ) : (
        <div className="space-y-2">
          {dims.map((d) => {
            const v = draft[d.id] ?? { weight: Number(d.weight), active: d.active };
            return (
              <Card key={d.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{d.description ?? ""}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{d.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">peso</span>
                    <Input
                      type="number" min={0} max={100} step={0.5}
                      className="w-24"
                      value={v.weight}
                      onChange={(e) => setDraft((p) => ({ ...p, [d.id]: { ...v, weight: parseFloat(e.target.value) || 0 } }))}
                    />
                  </div>
                  <Switch checked={v.active} onCheckedChange={(checked) => setDraft((p) => ({ ...p, [d.id]: { ...v, active: checked } }))} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={save} disabled={!sumOk || update.isPending}>Salvar dimensões</Button>
        <Button variant="outline" onClick={recalc} disabled={trigger.isPending}>
          {trigger.isPending ? "Calculando…" : "Disparar cálculo agora"}
        </Button>
      </div>
    </div>
  );
}
