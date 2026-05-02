import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export type QuizQuestion = {
  id: string;
  question_text: string;
  options: string[];
  ordem: number;
};

export function QuizRunner({
  questions,
  onSubmit,
  submitting,
}: {
  questions: QuizQuestion[];
  onSubmit: (answers: Record<string, number>) => void;
  submitting: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);

  if (questions.length === 0) return <p className="text-muted-foreground">Este módulo não tem perguntas.</p>;

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  function next() {
    if (selected === null) return;
    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);
    if (isLast) onSubmit(newAnswers);
    else setIdx(idx + 1);
  }

  return (
    <Card>
      <CardHeader>
        <Progress value={((idx + 1) / questions.length) * 100} className="h-1.5" />
        <CardTitle className="mt-3 text-base">
          Pergunta {idx + 1} de {questions.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-base font-medium">{q.question_text}</p>
        <RadioGroup value={selected?.toString() ?? ""} onValueChange={(v) => setSelected(Number(v))}>
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/40">
              <RadioGroupItem id={`opt-${i}`} value={i.toString()} />
              <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
        <div className="flex justify-end">
          <Button onClick={next} disabled={selected === null || submitting}>
            {submitting ? "Enviando..." : isLast ? "Finalizar quiz" : "Próxima"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
