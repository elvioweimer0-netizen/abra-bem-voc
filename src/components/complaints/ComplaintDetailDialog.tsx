import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpdateComplaint } from "@/hooks/useCreateComplaint";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import type { Complaint } from "@/hooks/useComplaints";

const CATEGORY_LABEL: Record<string, string> = {
  atendimento: "Atendimento", produto: "Produto", preco: "Preço",
  fila: "Fila", limpeza: "Limpeza", estoque: "Estoque", outros: "Outros",
};
const SEVERITY_LABEL: Record<string, string> = {
  leve: "Leve", media: "Média", grave: "Grave", muito_grave: "Muito grave",
};

export function ComplaintDetailDialog({
  complaint, open, onOpenChange,
}: { complaint: Complaint | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { isLider, isAdmin, isSupervisor } = useRole();
  const canEdit = isLider || isAdmin || isSupervisor;
  const { toast } = useToast();
  const update = useUpdateComplaint();
  const [action, setAction] = useState("");

  useEffect(() => {
    setAction(complaint?.action_taken ?? "");
  }, [complaint?.id]);

  if (!complaint) return null;

  const handleStatus = async (status: "em_andamento" | "resolvida") => {
    try {
      await update.mutateAsync({ id: complaint.id, status, action_taken: action });
      toast({ title: status === "resolvida" ? "Marcada como resolvida" : "Em andamento" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reclamação de cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge>{CATEGORY_LABEL[complaint.category] ?? complaint.category}</Badge>
            <Badge variant="outline">{SEVERITY_LABEL[complaint.severity]}</Badge>
            {complaint.setor && <Badge variant="secondary">{complaint.setor}</Badge>}
            <Badge variant={complaint.status === "resolvida" ? "secondary" : "outline"}>
              {complaint.status}
            </Badge>
          </div>

          <div>
            <Label className="text-xs">Descrição</Label>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {complaint.customer_contact && (
            <div>
              <Label className="text-xs">Contato do cliente</Label>
              <p className="text-sm text-foreground/90">{complaint.customer_contact}</p>
            </div>
          )}

          <div>
            <Label className="text-xs">Ação tomada</Label>
            {canEdit && complaint.status !== "resolvida" ? (
              <Textarea
                rows={3}
                value={action}
                maxLength={1000}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Descreva a ação tomada"
              />
            ) : (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                {complaint.action_taken || <span className="text-muted-foreground">—</span>}
              </p>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Registrada em {new Date(complaint.created_at).toLocaleString("pt-BR")}
            {complaint.resolved_at && (
              <> • Resolvida em {new Date(complaint.resolved_at).toLocaleString("pt-BR")}</>
            )}
          </p>
        </div>

        <DialogFooter>
          {canEdit && complaint.status !== "resolvida" && (
            <>
              {complaint.status === "aberta" && (
                <Button variant="outline" onClick={() => handleStatus("em_andamento")}>
                  Em andamento
                </Button>
              )}
              <Button onClick={() => handleStatus("resolvida")} disabled={update.isPending}>
                Marcar como resolvida
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
