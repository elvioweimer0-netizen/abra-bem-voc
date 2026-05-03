import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { LeadershipQuestion } from "@/hooks/useLeadershipQuestions";

export function QuestionCard({ question }: { question: LeadershipQuestion }) {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Calendar className="h-3 w-3" />
        Semana de {new Date(question.week_start_date + "T12:00").toLocaleDateString("pt-BR")}
      </div>
      <h2 className="text-xl md:text-2xl font-semibold leading-snug">{question.question_text}</h2>
      {question.context_note && (
        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{question.context_note}</p>
      )}
    </Card>
  );
}
