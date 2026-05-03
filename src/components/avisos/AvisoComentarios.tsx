import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAvisoComments } from "@/hooks/useAvisoEngagement";
import { AvisoCommentItem } from "./AvisoCommentItem";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function AvisoComentarios({ avisoId }: { avisoId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useAvisoComments(avisoId);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["aviso-comments", avisoId] });

  const submit = async () => {
    const body = text.trim();
    if (!body || !user) return;
    setBusy(true);
    const { error } = await supabase.from("aviso_comments").insert({
      aviso_id: avisoId, user_id: user.id, body, parent_comment_id: null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setText(""); refresh();
  };

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <MessageSquare className="w-4 h-4" /> Comentários {data && <span className="text-muted-foreground">({data.total})</span>}
      </h2>
      <div className="space-y-2">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={3} placeholder="Escreva um comentário…" />
        <div className="flex justify-end">
          <Button onClick={submit} disabled={busy || !text.trim()}>Comentar</Button>
        </div>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !data?.roots.length ? (
        <p className="text-sm text-muted-foreground">Seja o primeiro a comentar.</p>
      ) : (
        <div>
          {data.roots.map((c) => (
            <AvisoCommentItem key={c.id} comment={c} avisoId={avisoId} onChanged={refresh} />
          ))}
        </div>
      )}
    </section>
  );
}
