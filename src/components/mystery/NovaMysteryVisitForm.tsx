import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useMysteryCriteria } from "@/hooks/useMysteryCriteria";
import { useCreateMysteryVisit } from "@/hooks/useCreateMysteryVisit";
import { useToast } from "@/hooks/use-toast";
import { MysteryPhotoUploader } from "./MysteryPhotoUploader";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export function NovaMysteryVisitForm({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: units = [] } = useAccessibleUnits();
  const { data: criteria = [] } = useMysteryCriteria();
  const create = useCreateMysteryVisit();
  const { toast } = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const [unitId, setUnitId] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [notes, setNotes] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);

  const allScored = useMemo(
    () => criteria.every((c) => typeof scores[c.id] === "number"),
    [criteria, scores],
  );

  const overallPreview = useMemo(() => {
    const vals = Object.values(scores);
    if (vals.length === 0) return 0;
    return Number(((vals.reduce((a, b) => a + b, 0) / vals.length) * 2).toFixed(1));
  }, [scores]);

  const reset = () => {
    setUnitId(""); setDate(today); setTime(""); setAnonymous(true);
    setNotes(""); setScores({}); setComments({}); setPhotos([]);
  };

  const submit = async () => {
    if (!unitId) { toast({ title: "Selecione a unidade alvo", variant: "destructive" }); return; }
    if (!allScored) { toast({ title: "Avalie todos os critérios", variant: "destructive" }); return; }
    try {
      await create.mutateAsync({
        target_unit_id: unitId,
        visit_date: date,
        visit_time: time || null,
        anonymous_to_team: anonymous,
        notes,
        scores: criteria.map((c) => ({
          criteria_id: c.id,
          score: scores[c.id],
          comment: comments[c.id] || null,
        })),
        photos,
      });
      toast({ title: "Visita registrada", description: `Score geral: ${overallPreview}/10` });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova visita — Cliente Misterioso</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <Label className="text-xs">Unidade alvo *</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.code} — {u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3">
              <div className="flex items-center gap-2">
                {anonymous ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <ShieldAlert className="h-4 w-4 text-amber-500" />}
                <Label className="text-xs cursor-pointer">Anônimo</Label>
              </div>
              <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            </div>
          </div>

          <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {anonymous
              ? "🔒 Gerente da unidade NÃO saberá quem visitou."
              : "⚠️ Gerente da unidade será notificado e saberá da visita (mas não verá quem)."}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Avaliação por critério (1-5)</h3>
              {Object.keys(scores).length > 0 && (
                <Badge variant="secondary">Prévia: {overallPreview}/10</Badge>
              )}
            </div>
            {criteria.map((c) => {
              const v = scores[c.id] ?? 3;
              return (
                <div key={c.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{c.name}</Label>
                    <Badge variant={scores[c.id] ? "default" : "outline"}>{scores[c.id] ?? "—"}/5</Badge>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[v]}
                    onValueChange={(val) => setScores((s) => ({ ...s, [c.id]: val[0] }))}
                  />
                  <Textarea
                    rows={1}
                    placeholder="Comentário (opcional)"
                    value={comments[c.id] || ""}
                    onChange={(e) => setComments((cs) => ({ ...cs, [c.id]: e.target.value }))}
                    maxLength={300}
                    className="text-xs"
                  />
                </div>
              );
            })}
          </div>

          <div>
            <Label className="text-xs">Observação geral (opcional)</Label>
            <Textarea
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resumo da visita, situações marcantes…"
            />
          </div>

          <div>
            <Label className="text-xs mb-2 block">Fotos</Label>
            <MysteryPhotoUploader files={photos} onChange={setPhotos} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Enviando..." : "Registrar visita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
