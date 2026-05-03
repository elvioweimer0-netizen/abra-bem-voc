import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, History } from "lucide-react";
import {
  useCurrentLeadershipQuestion,
  useMyAnswer,
  useLeadershipAnswers,
  deadlinePassed,
} from "@/hooks/useLeadershipQuestions";
import { QuestionCard } from "@/components/leadership-questions/QuestionCard";
import { QuestionCountdown } from "@/components/leadership-questions/QuestionCountdown";
import { AnswerForm } from "@/components/leadership-questions/AnswerForm";
import { AnswerList } from "@/components/leadership-questions/AnswerList";
import { useAuth } from "@/contexts/AuthContext";

export default function PerguntaSemana() {
  const { user } = useAuth();
  const { data: question, isLoading } = useCurrentLeadershipQuestion();
  const { data: myAnswer } = useMyAnswer(question?.id);
  const { data: answers = [] } = useLeadershipAnswers(question?.id);

  if (isLoading) return <div className="container mx-auto p-6">Carregando...</div>;
  if (!question) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Pergunta da Semana</h1>
        <p className="text-muted-foreground">Nenhuma pergunta ativa no momento.</p>
        <Button variant="link" asChild className="mt-2 px-0"><Link to="/pergunta-semana/historico"><History className="h-4 w-4 mr-1" />Ver histórico</Link></Button>
      </div>
    );
  }

  const passed = deadlinePassed(question);
  const hasAnswered = !!myAnswer;
  const othersAnswers = answers.filter((a) => a.user_id !== user?.id);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Pergunta da Semana</h1>
        <Button variant="outline" size="sm" asChild><Link to="/pergunta-semana/historico"><History className="h-4 w-4 mr-1" />Histórico</Link></Button>
      </div>

      <QuestionCard question={question} />
      <QuestionCountdown deadlineDate={question.deadline_date} />

      <Card className="p-5">
        <h2 className="font-semibold mb-3">{hasAnswered ? "Sua resposta" : "Sua reflexão"}</h2>
        {hasAnswered && passed ? (
          <p className="whitespace-pre-wrap text-sm">{myAnswer!.answer_text}</p>
        ) : (
          <AnswerForm
            questionId={question.id}
            initial={myAnswer ? { id: myAnswer.id, answer_text: myAnswer.answer_text } : null}
            disabled={passed && !hasAnswered}
          />
        )}
      </Card>

      <section>
        <h2 className="font-semibold mb-3">Respostas dos colegas</h2>
        {!hasAnswered && !passed ? (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>Submeta sua resposta primeiro para ver as reflexões dos outros líderes.</AlertDescription>
          </Alert>
        ) : (
          <AnswerList answers={othersAnswers} canComment={passed} />
        )}
      </section>
    </div>
  );
}
