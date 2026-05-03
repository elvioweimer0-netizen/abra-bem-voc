import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAddProgress } from "@/hooks/usePdi";

export function PdiProgressForm({
  open,
  onClose,
  goalId,
  hasMetaValor,
}: {
  open: boolean;
  onClose: () => void;
  goalId: string;
  hasMetaValor: boolean;
}) {
  const [observacao, setObservacao] = useState("");
  const [valorAtual, setValorAtual] = useState<string>("");
  const add = useAddProgress();

  const submit = async () => {
    await add.mutateAsync({
      goal_id: goalId,
      observacao: observacao.trim(),
      valor_atual: hasMetaValor && valorAtual ? Number(valorAtual) : null,
    });
    setObservacao("");
    setValorAtual("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova atualização</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {hasMetaValor && (
            <div>
              <Label>Valor atual</Label>
              <Input type="number" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Observação</Label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!observacao.trim() || add.isPending}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
