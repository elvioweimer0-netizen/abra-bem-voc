import { useState } from "react";
import { CurioStory, useModerateStory } from "@/hooks/useCurioStories";
import { HistoriaCard } from "./HistoriaCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function ModeracaoHistoriaItem({ story }: { story: CurioStory }) {
  const [note, setNote] = useState(story.moderation_note ?? "");
  const moderate = useModerateStory();

  const act = async (status: "aprovada" | "rejeitada" | "arquivada") => {
    if (status === "rejeitada" && !note.trim()) {
      toast.error("Motivo é obrigatório para rejeitar");
      return;
    }
    try {
      await moderate.mutateAsync({ id: story.id, status, note: note.trim() || undefined });
      toast.success(status === "aprovada" ? "Aprovada e publicada" : status === "rejeitada" ? "Rejeitada com motivo" : "Arquivada");
    } catch (e: any) {
      toast.error(e.message || "Falha");
    }
  };

  return (
    <div className="space-y-2">
      <HistoriaCard story={story} />
      {story.status !== "aprovada" || true ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Textarea
              placeholder="Nota da moderação (obrigatória pra rejeitar)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              {story.status !== "aprovada" && (
                <Button size="sm" onClick={() => act("aprovada")} disabled={moderate.isPending}>Aprovar</Button>
              )}
              {story.status !== "rejeitada" && (
                <Button size="sm" variant="outline" onClick={() => act("rejeitada")} disabled={moderate.isPending}>Rejeitar</Button>
              )}
              {story.status !== "arquivada" && (
                <Button size="sm" variant="ghost" onClick={() => act("arquivada")} disabled={moderate.isPending}>Arquivar</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
