import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSaveArticle, type PlaybookArticle, type PlaybookCategory } from "@/hooks/usePlaybook";
import { toast } from "sonner";

const ALL_ROLES = [
  "master","admin","supervisor","gerente","gerente_loja","gerente_adm","encarregado","fiscal","lider_setor",
];

type Props = {
  open: boolean;
  onClose: () => void;
  article?: PlaybookArticle | null;
  categories: PlaybookCategory[];
};

export function PlaybookArticleFormModal({ open, onClose, article, categories }: Props) {
  const save = useSaveArticle();
  const [form, setForm] = useState({
    title: "",
    category_id: "",
    context: "",
    script: "",
    what_not_to_do: "",
    real_example: "",
    video_url: "",
    tags: "",
    visible_to: ALL_ROLES,
    active: true,
  });

  useEffect(() => {
    if (article) {
      setForm({
        title: article.title,
        category_id: article.category_id,
        context: article.context,
        script: article.script ?? "",
        what_not_to_do: article.what_not_to_do ?? "",
        real_example: article.real_example ?? "",
        video_url: article.video_url ?? "",
        tags: (article.tags ?? []).join(", "),
        visible_to: article.visible_to ?? ALL_ROLES,
        active: article.active,
      });
    } else {
      setForm({
        title: "", category_id: categories[0]?.id ?? "", context: "", script: "",
        what_not_to_do: "", real_example: "", video_url: "", tags: "",
        visible_to: ALL_ROLES, active: true,
      });
    }
  }, [article, open, categories]);

  const handleSave = async () => {
    if (form.title.length < 5) return toast.error("Título: mínimo 5 caracteres");
    if (!form.category_id) return toast.error("Selecione uma categoria");
    if (!form.context.trim()) return toast.error("Contexto é obrigatório");
    try {
      await save.mutateAsync({
        ...(article ? { id: article.id } : {}),
        title: form.title,
        category_id: form.category_id,
        context: form.context,
        script: form.script || null,
        what_not_to_do: form.what_not_to_do || null,
        real_example: form.real_example || null,
        video_url: form.video_url || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        visible_to: form.visible_to,
        active: form.active,
      });
      toast.success("Artigo salvo");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Contexto (markdown)</Label>
            <Textarea rows={5} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} />
          </div>
          <div>
            <Label>Script</Label>
            <Textarea rows={4} value={form.script} onChange={(e) => setForm({ ...form, script: e.target.value })} />
          </div>
          <div>
            <Label>O que NÃO fazer</Label>
            <Textarea rows={3} value={form.what_not_to_do} onChange={(e) => setForm({ ...form, what_not_to_do: e.target.value })} />
          </div>
          <div>
            <Label>Exemplo real</Label>
            <Textarea rows={3} value={form.real_example} onChange={(e) => setForm({ ...form, real_example: e.target.value })} />
          </div>
          <div>
            <Label>URL do vídeo</Label>
            <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
          </div>
          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div>
            <Label>Visível para os cargos</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ALL_ROLES.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.visible_to.includes(r)}
                    onCheckedChange={(checked) => {
                      setForm({
                        ...form,
                        visible_to: checked
                          ? [...form.visible_to, r]
                          : form.visible_to.filter((x) => x !== r),
                      });
                    }}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: !!c })} />
            Ativo
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
