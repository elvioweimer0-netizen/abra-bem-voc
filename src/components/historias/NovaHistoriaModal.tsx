import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCultureValues } from "@/hooks/useCulturePills";
import { useCreateStory } from "@/hooks/useCurioStories";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().trim().min(5, "Título precisa de pelo menos 5 caracteres").max(100, "Máximo 100 caracteres"),
  value_id: z.string().nullable(),
  content: z.string().trim().min(30, "Conte mais um pouco (mínimo 30 caracteres)").max(1500, "Máximo 1500 caracteres"),
});

const MAX_FILE = 5 * 1024 * 1024;

export function NovaHistoriaModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: values = [] } = useCultureValues();
  const create = useCreateStory();
  const [title, setTitle] = useState("");
  const [valueId, setValueId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const reset = () => { setTitle(""); setValueId(null); setContent(""); setFile(null); };

  const onSubmit = async () => {
    const parsed = schema.safeParse({ title, value_id: valueId, content });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (file && file.size > MAX_FILE) {
      toast.error("Imagem máxima 5MB");
      return;
    }
    try {
      await create.mutateAsync({ title, content, value_id: valueId, imageFile: file });
      toast.success("Enviada pra moderação. Aprovada vai pro feed.");
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Falha ao enviar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Contar uma história</DialogTitle>
          <DialogDescription>Compartilhe um momento real que aconteceu na nossa rede.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: O cliente que voltou pra agradecer" />
            <p className="text-xs text-muted-foreground">{title.length}/100</p>
          </div>
          <div className="space-y-1.5">
            <Label>Valor da Cultura (opcional)</Label>
            <Select value={valueId ?? "none"} onValueChange={(v) => setValueId(v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem valor específico</SelectItem>
                {values.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Conte um momento real</Label>
            <Textarea rows={6} maxLength={1500} value={content} onChange={(e) => setContent(e.target.value)} placeholder="O que aconteceu, quem participou, por que importa..." />
            <p className="text-xs text-muted-foreground">{content.length}/1500</p>
          </div>
          <div className="space-y-1.5">
            <Label>Foto (opcional, até 5MB)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={create.isPending}>{create.isPending ? "Enviando..." : "Enviar pra moderação"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
