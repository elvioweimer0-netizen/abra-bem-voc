import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResolveChurnRisk, STATUS_LABELS } from "@/hooks/useChurnRisk";
import { toast } from "@/hooks/use-toast";

const STATUS_OPTIONS = ["resolvido_1on1", "resolvido_outro", "falso_positivo", "colaborador_saiu"] as const;

export function ResolverChurnModal({ id, open, onOpenChange }: { id: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [status, setStatus] = useState<string>("resolvido_1on1");
  const [note, setNote] = useState("");
  const mut = useResolveChurnRisk();

  async function submit() {
    if (note.trim().length < 5) {
      toast({ title: "Observação obrigatória (mín. 5 caracteres)", variant: "destructive" });
      return;
    }
    try {
      await mut.mutateAsync({ id, status, note });
      toast({ title: "Registrado" });
      onOpenChange(false);
      setNote("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar resolução</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Resultado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observação (auditoria)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="O que foi conversado, próximos passos…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={mut.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
