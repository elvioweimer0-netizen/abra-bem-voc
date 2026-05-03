import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { AuditoriaRow } from "@/hooks/useAuditoriaVisual";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CobrarGerenteModal({
  row,
  open,
  onClose,
}: {
  row: AuditoriaRow;
  open: boolean;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const dataStr = row.completed_at
    ? format(parseISO(row.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : "";
  const tituloPre = `Auditoria visual: ${row.item_text}`;
  const descPre = `Foto registrada na ${row.unit_code ?? row.unit_name ?? "loja"} em ${dataStr}.\n\nItem: ${row.item_text}\nResponsável: ${row.gestor_nome ?? "—"} (${row.gestor_cargo ?? ""})\nObservação: ${row.observacao ?? "—"}\n\nNecessária ação corretiva.`;

  const [titulo, setTitulo] = useState(tituloPre);
  const [descricao, setDescricao] = useState(descPre);
  const [urgencia, setUrgencia] = useState<"baixa" | "media" | "alta">("media");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!row.unit_id || !profile?.user_id) return;
    setSubmitting(true);
    const { error } = await (supabase as any).from("leadership_occurrences").insert({
      unit_id: row.unit_id,
      reportado_por: profile.user_id,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      tipo: "outro",
      gravidade: urgencia,
      urgencia,
      motivos: ["operacional"],
      fotos: row.foto_url ? [row.foto_url] : [],
      foto_url: row.foto_url,
      status: "aberto",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cobrança registrada");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Cobrar gerente</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Título</Label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div>
            <Label>Urgência</Label>
            <Select value={urgencia} onValueChange={(v) => setUrgencia(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={6} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting || !titulo.trim() || !descricao.trim()}>
            Registrar cobrança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
