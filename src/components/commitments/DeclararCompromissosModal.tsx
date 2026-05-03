import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDeclareCommitments, type Commitment } from "@/hooks/useWeeklyCommitments";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: Commitment[];
};

export function DeclararCompromissosModal({ open, onOpenChange, existing }: Props) {
  const [texts, setTexts] = useState<string[]>(["", "", ""]);
  const declare = useDeclareCommitments();

  useEffect(() => {
    const arr = ["", "", ""];
    existing?.forEach((c) => { arr[c.ordem - 1] = c.commitment_text; });
    setTexts(arr);
  }, [existing, open]);

  const submit = async () => {
    await declare.mutateAsync(texts);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Declarar compromissos da semana</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => {
            const len = texts[i].length;
            const valid = len === 0 || (len >= 10 && len <= 200);
            return (
              <div key={i}>
                <Label>Compromisso {i + 1}</Label>
                <Textarea
                  rows={2}
                  maxLength={200}
                  value={texts[i]}
                  onChange={(e) => setTexts((p) => p.map((t, j) => (j === i ? e.target.value : t)))}
                  placeholder="Mínimo 10, máximo 200 caracteres"
                />
                <p className={`text-xs ${valid ? "text-muted-foreground" : "text-destructive"}`}>{len}/200</p>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={declare.isPending}>Publicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
