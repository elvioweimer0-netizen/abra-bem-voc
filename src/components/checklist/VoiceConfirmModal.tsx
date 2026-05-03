import { useEffect, useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface VoiceMatch {
  item_id: string;
  confidence: "high" | "medium" | "low";
  evidence: string;
}

export interface VoiceItem {
  id: string;
  descricao: string;
  requires_photo?: boolean;
  has_photo?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: VoiceItem[];
  matches: VoiceMatch[];
  transcript: string;
  onConfirm: (itemIds: string[]) => void;
}

export function VoiceConfirmModal({ open, onOpenChange, items, matches, transcript, onConfirm }: Props) {
  const matchMap = new Map(matches.map((m) => [m.item_id, m]));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const next = new Set<string>();
    for (const m of matches) {
      if (m.confidence === "low") continue;
      const item = items.find((i) => i.id === m.item_id);
      if (!item) continue;
      // se requer foto e não tem, não pré-marca
      if (item.requires_photo && !item.has_photo) continue;
      next.add(m.item_id);
    }
    setSelected(next);
  }, [open, matches, items]);

  const toggle = (id: string) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = () => {
    onConfirm(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Confirmar marcação por voz
          </DialogTitle>
          <DialogDescription>Revise os itens identificados antes de aplicar.</DialogDescription>
        </DialogHeader>

        {transcript && (
          <div className="rounded-md bg-muted p-3 text-xs italic text-muted-foreground">
            "{transcript}"
          </div>
        )}

        <ScrollArea className="max-h-[50vh] pr-2">
          <div className="space-y-2">
            {items.map((item) => {
              const match = matchMap.get(item.id);
              const isSelected = selected.has(item.id);
              const blockedByPhoto = item.requires_photo && !item.has_photo;
              const tone = !match
                ? "border-border bg-muted/30"
                : match.confidence === "high"
                ? "border-success/40 bg-success/5"
                : match.confidence === "medium"
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-border bg-muted/30";

              return (
                <div key={item.id} className={`rounded-lg border-2 p-3 ${tone}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(item.id)}
                      disabled={blockedByPhoto}
                      className="mt-0.5 h-6 w-6"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.descricao}</p>
                      {match?.evidence && (
                        <p className="mt-1 text-xs text-muted-foreground">"{match.evidence}"</p>
                      )}
                      {match?.confidence === "medium" && (
                        <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          Confirme: você marcou este item?
                        </p>
                      )}
                      {blockedByPhoto && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <Camera className="h-3 w-3" /> Foto obrigatória — capture e marque manualmente
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={selected.size === 0}>
            Confirmar e marcar ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
