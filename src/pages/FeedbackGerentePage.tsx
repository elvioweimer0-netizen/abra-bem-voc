import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  useActiveCycle,
  useFeedbackQuestions,
  useMyManager,
  useAlreadyAnswered,
  useSubmitFeedback,
} from "@/hooks/useManagerFeedback";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";

export default function FeedbackGerentePage() {
  const navigate = useNavigate();
  const { data: cycle, isLoading: lc } = useActiveCycle();
  const { data: questions = [] } = useFeedbackQuestions();
  const { data: manager } = useMyManager();
  const { data: answered } = useAlreadyAnswered(cycle?.id);
  const submit = useSubmitFeedback();

  if (lc) return <div className="p-4">Carregando...</div>;
  if (!cycle) return (
    <div className="mx-auto max-w-xl p-4">
      <Card><CardContent className="p-4 text-sm text-muted-foreground">Nenhum ciclo de feedback aberto agora.</CardContent></Card>
    </div>
  );
  if (!manager) return (
    <div className="mx-auto max-w-xl p-4">
      <Card><CardContent className="p-4 text-sm text-muted-foreground">Sua unidade não tem gerente cadastrado.</CardContent></Card>
    </div>
  );
  if (answered) return (
    <div className="mx-auto max-w-xl p-4">
      <Card><CardContent className="p-4 text-sm text-foreground">
        Você já respondeu este ciclo. Obrigado pela contribuição!
      </CardContent></Card>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feedback ao gerente</h1>
        <p className="text-sm text-muted-foreground">Ciclo {cycle.year} · T{cycle.quarter}</p>
      </div>
      <FeedbackForm
        questions={questions}
        managerName={(manager as any).nome}
        submitting={submit.isPending}
        onSubmit={async (answers) => {
          await submit.mutateAsync({ cycle_id: cycle.id, manager_user_id: (manager as any).user_id, answers });
          navigate("/");
        }}
      />
    </div>
  );
}
