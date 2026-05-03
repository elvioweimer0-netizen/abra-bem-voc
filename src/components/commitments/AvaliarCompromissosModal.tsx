import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvaluateCommitment, type Commitment, type CommitmentStatus } from "@/hooks/useWeeklyCommitments";
import { STATUS_OPTIONS } from "./CommitmentStatusBadge";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  commitments: Commitment[];
};

type State = Record<string, { status: CommitmentStatus; evidencia: string }>;

export function AvaliarCompromissosModal({ open, onOpenChange, commitments }: Props) {
  const [state, setState] = useState<State>({});
  const evaluate = useEvaluateCommitment();

  useEffect(() => {
    const next: State = {};
    commitments.forEach((c) => {
      next[c.id] = {
        status: (c.status === "em_andamento" ? "cumprido" : c.status) as CommitmentStatus,
        evidencia: c.evidencia ?? "",
      };
    });
    setState(next);
  }, [commitments, open]);

  const submit = async () => {
    for (const c of commitments) {
      const s = state[c.id];
      if (!s) continue;
      await evaluate.mutateAsync({ id: c.id, status: s.status, evidencia: s.evidencia });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar compromissos da semana</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {commitments.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-sm font-medium">{c.ordem}. {c.commitment_text}</p>
              <Select
                value={state[c.id]?.status}
                onValueChange={(v) => setState((p) => ({ ...p, [c.id]: { ...p[c.id], status: v as CommitmentStatus } }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea
                rows={2}
                placeholder="Evidência (opcional)"
                value={state[c.id]?.evidencia ?? ""}
                onChange={(e) => setState((p) => ({ ...p, [c.id]: { ...p[c.id], evidencia: e.target.value } }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={evaluate.isPending}>Salvar avaliação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
