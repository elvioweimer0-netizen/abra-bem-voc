import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSubmitAnswer, useEditAnswer } from "@/hooks/useLeadershipQuestions";
import { toast } from "sonner";

type Props = {
  questionId: string;
  initial?: { id: string; answer_text: string } | null;
  onDone?: () => void;
  disabled?: boolean;
};

export function AnswerForm({ questionId, initial, onDone, disabled }: Props) {
  const [text, setText] = useState(initial?.answer_text ?? "");
  const submit = useSubmitAnswer();
  const edit = useEditAnswer();

  useEffect(() => { setText(initial?.answer_text ?? ""); }, [initial]);

  const len = text.length;
  const valid = len >= 50 && len <= 2000;
  const busy = submit.isPending || edit.isPending;

  const handle = async () => {
    if (!valid) return toast.error("Resposta entre 50 e 2000 caracteres");
    try {
      if (initial) await edit.mutateAsync({ id: initial.id, text });
      else await submit.mutateAsync({ questionId, text });
      toast.success(initial ? "Resposta atualizada" : "Resposta enviada");
      onDone?.();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-2">
      <Textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escreva sua reflexão (mínimo 50 caracteres)"
        disabled={disabled}
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${len > 2000 ? "text-destructive" : "text-muted-foreground"}`}>{len} / 2000</span>
        <Button onClick={handle} disabled={busy || disabled || !valid}>
          {initial ? "Salvar edição" : "Submeter resposta"}
        </Button>
      </div>
    </div>
  );
}
