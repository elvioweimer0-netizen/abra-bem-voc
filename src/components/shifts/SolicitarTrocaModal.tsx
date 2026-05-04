import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnitTeam } from "@/hooks/useUnitTeam";
import { useCreateSwap } from "@/hooks/useShiftSwaps";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function SolicitarTrocaModal({ open, onOpenChange, shiftId, unitId }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shiftId: string;
  unitId: string;
}) {
  const { user } = useAuth();
  const { data: team = [] } = useUnitTeam(unitId);
  const { mutateAsync, isPending } = useCreateSwap();
  const { toast } = useToast();
  const [swapWith, setSwapWith] = useState<string>("");
  const [message, setMessage] = useState("");

  async function submit() {
    try {
      await mutateAsync({ shiftId, swapWith: swapWith || null, message });
      toast({ title: "Solicitação enviada" });
      onOpenChange(false);
      setMessage(""); setSwapWith("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Solicitar troca</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Colega (opcional)</Label>
            <Select value={swapWith} onValueChange={setSwapWith}>
              <SelectTrigger><SelectValue placeholder="Aberto a qualquer um" /></SelectTrigger>
              <SelectContent>
                {team.filter((m) => m.user_id !== user?.id).map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Explique o motivo" />
          </div>
          <Button className="w-full" onClick={submit} disabled={isPending}>Enviar solicitação</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
