import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import {
  useAnswerComments,
  useAddComment,
  useDeleteComment,
  type LeadershipAnswer,
} from "@/hooks/useLeadershipQuestions";
import { toast } from "sonner";

export function LeadershipAnswerComments({ answer, canComment }: { answer: LeadershipAnswer; canComment: boolean }) {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { data: comments = [] } = useAnswerComments(answer.id);
  const addC = useAddComment();
  const delC = useDeleteComment();
  const [text, setText] = useState("");

  const handleAdd = async () => {
    if (text.length < 5 || text.length > 500) return toast.error("Comentário entre 5 e 500 caracteres");
    try {
      await addC.mutateAsync({ answerId: answer.id, text });
      setText("");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="mt-3 space-y-2 border-l-2 border-muted pl-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MessageSquare className="h-3 w-3" /> Discussão ({comments.length})
      </div>
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2 text-sm">
          <Avatar className="h-6 w-6">
            <AvatarImage src={c.author?.foto_url ?? undefined} />
            <AvatarFallback>{(c.author?.nome ?? "?").slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-medium">{c.author?.nome ?? "Líder"}</p>
            <p className="whitespace-pre-wrap">{c.comment_text}</p>
          </div>
          {(c.author_user_id === user?.id || isAdmin) && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => delC.mutate({ id: c.id, answerId: answer.id })}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {canComment ? (
        <div className="space-y-1">
          <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Adicionar comentário..." />
          <Button size="sm" onClick={handleAdd} disabled={addC.isPending}>Comentar</Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Comentários liberados após o prazo da pergunta</p>
      )}
    </div>
  );
}

export function AnswerItem({ answer, canComment }: { answer: LeadershipAnswer; canComment: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={answer.author?.foto_url ?? undefined} />
          <AvatarFallback>{(answer.author?.nome ?? "?").slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-semibold text-sm">{answer.author?.nome ?? "Líder"}</p>
            <span className="text-xs text-muted-foreground">
              {new Date(answer.submitted_at).toLocaleDateString("pt-BR")}
              {answer.edited_at && " · editado"}
            </span>
          </div>
          {answer.author?.cargo_titulo && (
            <p className="text-xs text-muted-foreground">{answer.author.cargo_titulo}</p>
          )}
          <p className="mt-2 text-sm whitespace-pre-wrap">{answer.answer_text}</p>
          <LeadershipAnswerComments answer={answer} canComment={canComment} />
        </div>
      </div>
    </Card>
  );
}

export function AnswerList({ answers, canComment }: { answers: LeadershipAnswer[]; canComment: boolean }) {
  if (!answers.length) return <p className="text-sm text-muted-foreground">Nenhuma resposta ainda.</p>;
  return (
    <div className="space-y-3">
      {answers.map((a) => <AnswerItem key={a.id} answer={a} canComment={canComment} />)}
    </div>
  );
}
