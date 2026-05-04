import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUnitTeam } from "@/hooks/useUnitTeam";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const setores = ["acougue", "padaria", "hortifruti", "mercearia", "frente_caixa", "deposito", "geral"];

export function NovoTurnoModal({ open, onOpenChange, unitId, defaultDate, defaultUserId }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unitId: string;
  defaultDate?: string;
  defaultUserId?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: team = [] } = useUnitTeam(unitId);
  const [form, setForm] = useState({
    user_id: defaultUserId ?? "",
    shift_date: defaultDate ?? new Date().toISOString().slice(0, 10),
    shift_start: "08:00",
    shift_end: "17:00",
    setor: "geral",
    role_in_shift: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.user_id) { toast({ title: "Selecione um colaborador", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await (supabase as any).from("shifts").insert({
      ...form,
      unit_id: unitId,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Turno criado" });
    qc.invalidateQueries({ queryKey: ["shifts"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo turno</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Colaborador</Label>
            <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {team.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.nome} — {m.cargo_titulo ?? m.cargo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Data</Label><Input type="date" value={form.shift_date} onChange={(e) => setForm({ ...form, shift_date: e.target.value })} /></div>
            <div><Label>Início</Label><Input type="time" value={form.shift_start} onChange={(e) => setForm({ ...form, shift_start: e.target.value })} /></div>
            <div><Label>Fim</Label><Input type="time" value={form.shift_end} onChange={(e) => setForm({ ...form, shift_end: e.target.value })} /></div>
          </div>
          <div>
            <Label>Setor</Label>
            <Select value={form.setor} onValueChange={(v) => setForm({ ...form, setor: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{setores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Função no turno (opcional)</Label><Input value={form.role_in_shift} onChange={(e) => setForm({ ...form, role_in_shift: e.target.value })} placeholder="Ex: Caixa principal" /></div>
          <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          <Button className="w-full" onClick={save} disabled={saving}>Criar turno</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
