import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useSubmitFeedback } from "@/hooks/usePlaybook";
import { toast } from "sonner";

type Props = {
  articleId: string;
  initial?: { useful: boolean | null; comment: string | null } | null;
};

export function PlaybookFeedbackBar({ articleId, initial }: Props) {
  const [useful, setUseful] = useState<boolean | null>(initial?.useful ?? null);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const submit = useSubmitFeedback();

  useEffect(() => {
    setUseful(initial?.useful ?? null);
    setComment(initial?.comment ?? "");
  }, [initial]);

  const handleVote = async (val: boolean) => {
    setUseful(val);
    try {
      await submit.mutateAsync({ articleId, useful: val, comment });
      toast.success("Obrigado pelo feedback!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSaveComment = async () => {
    try {
      await submit.mutateAsync({ articleId, useful, comment });
      toast.success("Comentário salvo");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="border-t pt-4 mt-6 space-y-3">
      <p className="text-sm font-medium">Esse artigo foi útil?</p>
      <div className="flex gap-2">
        <Button variant={useful === true ? "default" : "outline"} size="sm" onClick={() => handleVote(true)}>
          <ThumbsUp className="h-4 w-4 mr-1" /> Sim
        </Button>
        <Button variant={useful === false ? "default" : "outline"} size="sm" onClick={() => handleVote(false)}>
          <ThumbsDown className="h-4 w-4 mr-1" /> Não
        </Button>
      </div>
      <Textarea
        placeholder="Deixe um comentário (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />
      <Button size="sm" onClick={handleSaveComment} disabled={submit.isPending}>
        Salvar comentário
      </Button>
    </div>
  );
}
