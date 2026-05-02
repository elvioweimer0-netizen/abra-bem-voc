import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoryLabels } from "@/components/treinamento/ModuleCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ModuleFormValue = {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  duration_seconds: number;
  category: string;
  thumbnail_url: string | null;
  ordem: number;
  active: boolean;
};

const empty: ModuleFormValue = {
  title: "", description: "", video_url: "", duration_seconds: 0,
  category: "outros", thumbnail_url: "", ordem: 0, active: true,
};

export function ModuleForm({
  open, onOpenChange, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: ModuleFormValue | null;
  onSaved: () => void;
}) {
  const [v, setV] = useState<ModuleFormValue>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setV(initial ?? empty); }, [initial, open]);

  async function save() {
    if (!v.title.trim() || !v.video_url.trim()) {
      toast.error("Título e URL do vídeo são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...v, thumbnail_url: v.thumbnail_url || null };
      if (v.id) {
        const { error } = await (supabase as any).from("training_modules").update(payload).eq("id", v.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("training_modules").insert(payload);
        if (error) throw error;
      }
      toast.success("Módulo salvo");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Falha: " + (e.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{v.id ? "Editar módulo" : "Novo módulo"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} rows={3} /></div>
          <div><Label>URL do vídeo (YouTube/Vimeo)</Label><Input value={v.video_url} onChange={(e) => setV({ ...v, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Duração (segundos)</Label><Input type="number" value={v.duration_seconds} onChange={(e) => setV({ ...v, duration_seconds: Number(e.target.value) })} /></div>
            <div><Label>Ordem</Label><Input type="number" value={v.ordem} onChange={(e) => setV({ ...v, ordem: Number(e.target.value) })} /></div>
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={v.category} onValueChange={(x) => setV({ ...v, category: x })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Miniatura (URL)</Label><Input value={v.thumbnail_url ?? ""} onChange={(e) => setV({ ...v, thumbnail_url: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={v.active} onCheckedChange={(c) => setV({ ...v, active: c })} /><Label>Ativo</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
