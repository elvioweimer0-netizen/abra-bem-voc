import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpsertAchievement, type Achievement } from "@/hooks/useAchievements";
import { toast } from "sonner";

const CATEGORIES = ["disciplina","lideranca","cultura","operacao","treinamento","tempo_curio","outros"];
const TYPES = ["count","streak","threshold","one_time","date_based"];

export function AchievementFormModal({ open, onOpenChange, item }: { open: boolean; onOpenChange: (o: boolean) => void; item: Achievement | null }) {
  const [form, setForm] = useState<Partial<Achievement>>({});
  const upsert = useUpsertAchievement();

  useEffect(() => {
    setForm(item ?? { active: true, ordem: 0, category: "outros", criteria_type: "count" });
  }, [item, open]);

  const submit = async () => {
    try {
      await upsert.mutateAsync(form);
      toast.success("Conquista salva");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar" : "Nova"} conquista</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Code</Label>
              <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <Label>Ícone (lucide)</Label>
              <Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Award" />
            </div>
          </div>
          <div>
            <Label>Nome</Label>
            <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.criteria_type} onValueChange={(v) => setForm({ ...form, criteria_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Meta</Label>
              <Input type="number" value={form.criteria_target ?? ""} onChange={(e) => setForm({ ...form, criteria_target: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>Métrica</Label>
            <Input value={form.criteria_metric ?? ""} onChange={(e) => setForm({ ...form, criteria_metric: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label>Ativa</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={upsert.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
