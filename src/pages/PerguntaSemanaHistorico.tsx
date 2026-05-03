import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "lucide-react";
import { useLeadershipQuestionHistory } from "@/hooks/useLeadershipQuestions";

export default function PerguntaSemanaHistorico() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: questions = [] } = useLeadershipQuestionHistory({ from: from || undefined, to: to || undefined });

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold">Histórico de Perguntas</h1>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>

      <div className="space-y-2">
        {questions.map((q) => (
          <Link key={q.id} to={`/pergunta-semana/${q.id}`}>
            <Card className="p-4 hover:bg-accent/40 transition flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Semana de {new Date(q.week_start_date + "T12:00").toLocaleDateString("pt-BR")}
                </p>
                <p className="font-medium mt-1">{q.question_text}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            </Card>
          </Link>
        ))}
        {!questions.length && <p className="text-sm text-muted-foreground">Nenhuma pergunta encontrada.</p>}
      </div>
    </div>
  );
}
