import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";
import { Pencil, Trash2, Reply, Check, X } from "lucide-react";
import type { AvisoComment } from "@/hooks/useAvisoEngagement";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

function initials(name?: string | null) {
  return (name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

interface Props {
  comment: AvisoComment;
  avisoId: string;
  isReply?: boolean;
  onChanged: () => void;
}

export function AvisoCommentItem({ comment, avisoId, isReply = false, onChanged }: Props) {
  const { user } = useAuth();
  const { isAdmin, isMaster } = useRole();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const [busy, setBusy] = useState(false);

  const isAuthor = user?.id === comment.user_id;
  const canEdit = isAuthor && Date.now() - new Date(comment.created_at).getTime() < EDIT_WINDOW_MS && !comment.deleted_at;
  const canModerate = isAdmin || isMaster;
  const canDelete = (isAuthor || canModerate) && !comment.deleted_at;

  const submitReply = async () => {
    const body = replyText.trim();
    if (!body || !user) return;
    setBusy(true);
    const { error } = await supabase.from("aviso_comments").insert({
      aviso_id: avisoId, user_id: user.id, body, parent_comment_id: comment.id,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setReplyText(""); setReplyOpen(false); onChanged();
  };

  const submitEdit = async () => {
    const body = editText.trim();
    if (!body) return;
    setBusy(true);
    const { error } = await supabase.from("aviso_comments")
      .update({ body, edited_at: new Date().toISOString() })
      .eq("id", comment.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setEditing(false); onChanged();
  };

  const softDelete = async () => {
    if (!confirm("Excluir este comentário?")) return;
    const { error } = await supabase.from("aviso_comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", comment.id);
    if (error) { toast.error(error.message); return; }
    onChanged();
  };

  return (
    <div className={isReply ? "ml-10 mt-2" : "mt-3"}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">{initials(comment.author?.nome)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{comment.author?.nome ?? "Usuário"}</span>
              <span className="text-xs text-muted-foreground">· {timeAgo(comment.created_at)}{comment.edited_at && " · editado"}</span>
            </div>
            {comment.deleted_at ? (
              <p className="mt-1 text-sm italic text-muted-foreground">Comentário removido por moderador</p>
            ) : editing ? (
              <div className="mt-2 space-y-2">
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={1000} rows={3} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitEdit} disabled={busy}><Check className="w-4 h-4" /> Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditText(comment.body); }}><X className="w-4 h-4" /> Cancelar</Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
            )}
          </div>
          {!comment.deleted_at && !editing && (
            <div className="mt-1 flex flex-wrap gap-1 text-xs">
              {!isReply && (
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setReplyOpen((v) => !v)}><Reply className="w-3.5 h-3.5" /> Responder</Button>
              )}
              {canEdit && <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(true)}><Pencil className="w-3.5 h-3.5" /> Editar</Button>}
              {canDelete && <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={softDelete}><Trash2 className="w-3.5 h-3.5" /> Excluir</Button>}
            </div>
          )}
          {replyOpen && (
            <div className="mt-2 space-y-2">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={1000} rows={2} placeholder="Sua resposta…" />
              <div className="flex gap-2">
                <Button size="sm" onClick={submitReply} disabled={busy || !replyText.trim()}>Responder</Button>
                <Button size="sm" variant="ghost" onClick={() => { setReplyOpen(false); setReplyText(""); }}>Cancelar</Button>
              </div>
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div>
              {comment.replies.map((r) => (
                <AvisoCommentItem key={r.id} comment={r} avisoId={avisoId} isReply onChanged={onChanged} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
