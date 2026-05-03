import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateStory } from "@/hooks/useStories";
import { toast } from "sonner";

export function StoryComposer({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const { data: units } = useAccessibleUnits();
  const create = useCreateStory();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [unitId, setUnitId] = useState<string>((profile as any)?.unit_id ?? "");

  function handleFile(f: File | null) {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { toast.error("Arquivo maior que 50MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp", "video/mp4"].includes(f.type)) {
      toast.error("Formato não suportado"); return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!file || !unitId) return;
    try {
      await create.mutateAsync({ file, caption, unit_id: unitId, setor: (profile as any)?.setor });
      toast.success("Story publicado!");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao publicar");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo story</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {!preview ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-muted">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                <span className="text-sm">📷 Câmera</span>
              </label>
              <label className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-muted">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                <span className="text-sm">🖼️ Galeria</span>
              </label>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden bg-black aspect-[9/16] max-h-[50vh]">
              {file?.type.startsWith("video/") ? (
                <video src={preview} controls className="w-full h-full object-contain" />
              ) : (
                <img src={preview} alt="" className="w-full h-full object-contain" />
              )}
            </div>
          )}

          <div>
            <Label>Unidade</Label>
            <select
              className="w-full border border-input rounded-md p-2 bg-background"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
            >
              <option value="">Selecione…</option>
              {(units ?? []).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Legenda (opcional)</Label>
            <Textarea
              maxLength={200}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Conta o que tá rolando…"
            />
            <div className="text-xs text-muted-foreground text-right">{caption.length}/200</div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={submit} disabled={!file || !unitId || create.isPending}>
              {create.isPending ? "Publicando…" : "Publicar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
