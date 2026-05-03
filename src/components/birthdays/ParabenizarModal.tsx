import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSendBirthdayWish } from "@/hooks/useBirthdays";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  toUserId: string;
  toName: string;
}

export function ParabenizarModal({ open, onOpenChange, toUserId, toName }: Props) {
  const [text, setText] = useState("");
  const send = useSendBirthdayWish();

  const submit = async () => {
    try {
      await send.mutateAsync({ toUserId, message: text });
      toast.success(`Mensagem enviada para ${toName.split(" ")[0]}! 🎉`);
      setText("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível enviar a mensagem.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parabenizar {toName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder="Escreva uma mensagem (opcional)…"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            rows={4}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">{text.length}/200</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={send.isPending}>Enviar 🎂</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
