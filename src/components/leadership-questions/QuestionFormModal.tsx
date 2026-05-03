import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSaveQuestion, type LeadershipQuestion } from "@/hooks/useLeadershipQuestions";
import { toast } from "sonner";

const ROLES = ["master","admin","supervisor","gerente_loja","gerente_adm","gerente","encarregado","fiscal","lider_setor"];

function nextMonday() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + (8 - day));
  return d.toISOString().slice(0, 10);
}

export function QuestionFormModal({ open, onClose, question }: { open: boolean; onClose: () => void; question?: LeadershipQuestion | null }) {
  const save = useSaveQuestion();
  const [form, setForm] = useState({
    week_start_date: nextMonday(),
    deadline_date: "",
    question_text: "",
    context_note: "",
    target_roles: ["master","admin","supervisor","gerente_loja","gerente_adm"],
    active: true,
  });

  useEffect(() => {
    if (question) {
      setForm({
        week_start_date: question.week_start_date,
        deadline_date: question.deadline_date,
        question_text: question.question_text,
        context_note: question.context_note ?? "",
        target_roles: question.target_roles,
        active: question.active,
      });
    } else {
      const monday = nextMonday();
      const wed = new Date(monday + "T12:00");
      wed.setDate(wed.getDate() + 2);
      setForm({
        week_start_date: monday,
        deadline_date: wed.toISOString().slice(0, 10),
        question_text: "",
        context_note: "",
        target_roles: ["master","admin","supervisor","gerente_loja","gerente_adm"],
        active: true,
      });
    }
  }, [question, open]);

  const handle = async () => {
    const len = form.question_text.length;
    if (len < 20 || len > 500) return toast.error("Pergunta entre 20 e 500 caracteres");
    if (!form.target_roles.length) return toast.error("Selecione ao menos um cargo");
    try {
      await save.mutateAsync({ ...(question ? { id: question.id } : {}), ...form, context_note: form.context_note || null });
      toast.success("Pergunta salva");
      onClose();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{question ? "Editar Pergunta" : "Nova Pergunta da Semana"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Semana (segunda)</Label><Input type="date" value={form.week_start_date} onChange={(e) => setForm({ ...form, week_start_date: e.target.value })} /></div>
            <div><Label>Prazo (deadline)</Label><Input type="date" value={form.deadline_date} onChange={(e) => setForm({ ...form, deadline_date: e.target.value })} /></div>
          </div>
          <div>
            <Label>Pergunta</Label>
            <Textarea rows={3} value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
            <p className="text-xs text-muted-foreground">{form.question_text.length} / 500 (mínimo 20)</p>
          </div>
          <div>
            <Label>Contexto (opcional)</Label>
            <Textarea rows={2} value={form.context_note} onChange={(e) => setForm({ ...form, context_note: e.target.value })} />
          </div>
          <div>
            <Label>Cargos alvo</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ROLES.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.target_roles.includes(r)}
                    onCheckedChange={(c) => setForm({ ...form, target_roles: c ? [...form.target_roles, r] : form.target_roles.filter((x) => x !== r) })}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: !!c })} /> Ativa
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handle} disabled={save.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
