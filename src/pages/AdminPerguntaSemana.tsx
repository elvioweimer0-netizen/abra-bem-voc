import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import {
  useLeadershipQuestionHistory,
  useAdminQuestionStats,
  type LeadershipQuestion,
} from "@/hooks/useLeadershipQuestions";
import { QuestionFormModal } from "@/components/leadership-questions/QuestionFormModal";

function StatsLine({ questionId }: { questionId: string }) {
  const { data } = useAdminQuestionStats(questionId);
  if (!data) return null;
  return <span className="text-xs text-muted-foreground">{data.answered}/{data.eligible} ({data.pct}%)</span>;
}

export default function AdminPerguntaSemana() {
  const { data: questions = [] } = useLeadershipQuestionHistory();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeadershipQuestion | null>(null);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Admin · Pergunta da Semana</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Nova pergunta</Button>
      </header>

      <div className="space-y-2">
        {questions.map((q) => (
          <Card key={q.id} className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/pergunta-semana/${q.id}`} className="font-medium hover:underline">{q.question_text}</Link>
                {!q.active && <Badge variant="outline">Inativa</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Semana {new Date(q.week_start_date + "T12:00").toLocaleDateString("pt-BR")} · prazo {new Date(q.deadline_date + "T12:00").toLocaleDateString("pt-BR")} · <StatsLine questionId={q.id} />
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setEditing(q); setOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
          </Card>
        ))}
        {!questions.length && <p className="text-sm text-muted-foreground">Nenhuma pergunta cadastrada.</p>}
      </div>

      <QuestionFormModal open={open} onClose={() => setOpen(false)} question={editing} />
    </div>
  );
}
