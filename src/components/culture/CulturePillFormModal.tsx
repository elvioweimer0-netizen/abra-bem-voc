import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCulturePillUpsert, useCultureValues, type CulturePill } from "@/hooks/useCulturePills";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<CulturePill> | null;
  defaultDate?: string;
};

export function CulturePillFormModal({ open, onOpenChange, initial, defaultDate }: Props) {
  const { data: values = [] } = useCultureValues();
  const upsert = useCulturePillUpsert();
  const [form, setForm] = useState({
    id: undefined as string | undefined,
    title: "",
    content: "",
    value_id: "",
    image_url: "",
    link_url: "",
    display_date: defaultDate ?? new Date().toISOString().slice(0, 10),
    active: true,
  });

  useEffect(() => {
    if (open) {
      setForm({
        id: initial?.id,
        title: initial?.title ?? "",
        content: initial?.content ?? "",
        value_id: initial?.value_id ?? values[0]?.id ?? "",
        image_url: initial?.image_url ?? "",
        link_url: initial?.link_url ?? "",
        display_date: initial?.display_date ?? defaultDate ?? new Date().toISOString().slice(0, 10),
        active: initial?.active ?? true,
      });
    }
  }, [open, initial, defaultDate, values]);

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.value_id || !form.display_date) {
      toast.error("Preencha título, conteúdo, valor e data.");
      return;
    }
    if (form.content.length > 280) {
      toast.error("Conteúdo deve ter até 280 caracteres.");
      return;
    }
    try {
      await upsert.mutateAsync({
        ...form,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
      });
      toast.success(form.id ? "Pílula atualizada" : "Pílula criada");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar pílula" : "Nova pílula de cultura"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={80} />
          </div>
          <div>
            <Label>Conteúdo ({form.content.length}/280)</Label>
            <Textarea
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value.slice(0, 280) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor</Label>
              <Select value={form.value_id} onValueChange={(v) => setForm({ ...form, value_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {values.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={form.display_date}
                onChange={(e) => setForm({ ...form, display_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>URL de imagem (opcional)</Label>
            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <div>
            <Label>Link (opcional)</Label>
            <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label>Ativa</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={upsert.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
