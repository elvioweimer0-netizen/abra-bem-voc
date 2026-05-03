import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import type { FeedbackQuestion } from "@/hooks/useManagerFeedback";

interface Props {
  questions: FeedbackQuestion[];
  onSubmit: (answers: { question_id: string; score: number; comment?: string }[]) => void;
  submitting?: boolean;
  managerName?: string;
}

export function FeedbackForm({ questions, onSubmit, submitting, managerName }: Props) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");

  const allAnswered = questions.every((q) => scores[q.id] != null);

  function submit() {
    if (!allAnswered) return;
    const answers = questions.map((q, i) => ({
      question_id: q.id,
      score: scores[q.id],
      comment: i === 0 && comment.trim() ? comment.trim().slice(0, 1000) : undefined,
    }));
    onSubmit(answers);
  }

  return (
    <div className="space-y-4">
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex gap-3 p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm text-foreground">
            <p className="font-semibold">100% anônimo</p>
            <p className="text-muted-foreground">
              Seu gerente <strong>nunca</strong> verá quem respondeu. Apenas médias agregadas com no mínimo 3 respostas
              são exibidas. Seu nome não é armazenado em nenhum lugar associado às respostas.
            </p>
          </div>
        </CardContent>
      </Card>

      {managerName && (
        <p className="text-sm text-muted-foreground">
          Você está avaliando: <strong className="text-foreground">{managerName}</strong>
        </p>
      )}

      {questions.map((q, idx) => (
        <Card key={q.id}>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-foreground">
              {idx + 1}. {q.question_text}
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={scores[q.id] === n ? "default" : "outline"}
                  size="sm"
                  className="h-10 w-12"
                  onClick={() => setScores({ ...scores, [q.id]: n })}
                >
                  {n}
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">1 = Discordo totalmente · 5 = Concordo totalmente</p>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="space-y-2 p-4">
          <Label>Comentário opcional (anônimo)</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
            placeholder="Algo que você queira destacar?"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">{comment.length}/1000</p>
        </CardContent>
      </Card>

      <Button className="w-full" disabled={!allAnswered || submitting} onClick={submit}>
        Enviar feedback anônimo
      </Button>
    </div>
  );
}
