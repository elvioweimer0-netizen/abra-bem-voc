import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLeadershipQuestion, useLeadershipAnswers, deadlinePassed } from "@/hooks/useLeadershipQuestions";
import { QuestionCard } from "@/components/leadership-questions/QuestionCard";
import { AnswerList } from "@/components/leadership-questions/AnswerList";

export default function PerguntaSemanaDetalhe() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const { data: question, isLoading } = useLeadershipQuestion(questionId);
  const { data: answers = [] } = useLeadershipAnswers(questionId);

  if (isLoading) return <div className="container mx-auto p-6">Carregando...</div>;
  if (!question) return <div className="container mx-auto p-6">Pergunta não encontrada.</div>;

  const passed = deadlinePassed(question);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
      <QuestionCard question={question} />
      <h2 className="font-semibold">Respostas ({answers.length})</h2>
      <AnswerList answers={answers} canComment={passed} />
    </div>
  );
}
