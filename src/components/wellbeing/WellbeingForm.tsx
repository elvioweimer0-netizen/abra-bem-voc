import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useWellbeingQuestions, useSubmitWellbeingCheckin } from "@/hooks/useWellbeing";
import { Loader2 } from "lucide-react";

export function WellbeingForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const { data: questions, isLoading } = useWellbeingQuestions();
  const submit = useSubmitWellbeingCheckin();
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");

  const allAnswered = useMemo(
    () => !!questions?.length && questions.every((q) => responses[q.id] != null),
    [questions, responses]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!questions?.length) {
    return <p className="text-muted-foreground">Nenhuma pergunta disponível no momento.</p>;
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const val = responses[q.id] ?? Math.ceil((q.scale_min + q.scale_max) / 2);
        return (
          <Card key={q.id} className="p-5 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {idx + 1} de {questions.length}
              </p>
              <p className="text-base font-medium text-foreground">{q.question_text}</p>
            </div>
            <div className="space-y-2">
              <Slider
                min={q.scale_min}
                max={q.scale_max}
                step={1}
                value={[val]}
                onValueChange={(v) => setResponses((prev) => ({ ...prev, [q.id]: v[0] }))}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{q.reverse_scoring ? "Nada" : "Quase nunca"}</span>
                <span className="font-semibold text-foreground">{val}</span>
                <span>{q.reverse_scoring ? "Muito" : "Quase sempre"}</span>
              </div>
            </div>
          </Card>
        );
      })}

      <Card className="p-5 space-y-2">
        <p className="text-sm font-medium">Quer compartilhar algo? (opcional)</p>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          placeholder="Espaço livre. Ninguém vê o texto além do sistema."
          rows={3}
        />
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={!allAnswered || submit.isPending}
        onClick={() =>
          submit.mutate(
            { responses, notes: notes.trim() || null },
            { onSuccess: () => onSubmitted?.() }
          )
        }
      >
        {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar check-in"}
      </Button>
    </div>
  );
}
