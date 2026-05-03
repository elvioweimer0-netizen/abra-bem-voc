import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSaveCategory, type PlaybookCategory } from "@/hooks/usePlaybook";
import { toast } from "sonner";

type Props = { open: boolean; onClose: () => void; category?: PlaybookCategory | null };

export function PlaybookCategoryFormModal({ open, onClose, category }: Props) {
  const save = useSaveCategory();
  const [form, setForm] = useState({ code: "", name: "", icon: "", description: "", ordem: 0, active: true });

  useEffect(() => {
    if (category) {
      setForm({
        code: category.code,
        name: category.name,
        icon: category.icon ?? "",
        description: category.description ?? "",
        ordem: category.ordem,
        active: category.active,
      });
    } else {
      setForm({ code: "", name: "", icon: "", description: "", ordem: 0, active: true });
    }
  }, [category, open]);

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) return toast.error("Código e nome são obrigatórios");
    try {
      await save.mutateAsync({
        ...(category ? { id: category.id } : {}),
        code: form.code.trim(),
        name: form.name.trim(),
        icon: form.icon || null,
        description: form.description || null,
        ordem: form.ordem,
        active: form.active,
      });
      toast.success("Categoria salva");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{category ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Código (slug)</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Ícone (lucide)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Ordem</Label><Input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })} /></div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: !!c })} /> Ativa
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={save.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
