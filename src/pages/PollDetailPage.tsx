import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePoll, usePollResults, usePollUnitBreakdown } from "@/hooks/usePoll";
import { PollCard } from "@/components/polls/PollCard";
import { PollUnitBreakdown } from "@/components/polls/PollUnitBreakdown";
import { useAuth } from "@/contexts/AuthContext";

export default function PollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: poll, isLoading } = usePoll(id);
  const { data: results } = usePollResults(id);
  const isAuthor = !!poll && user?.id === poll.author_user_id;
  const { data: breakdown } = usePollUnitBreakdown(isAuthor ? id : undefined, results?.voterIds ?? []);

  if (isLoading) return <div className="p-4">Carregando...</div>;
  if (!poll) return <div className="p-4">Enquete não encontrada.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Button>
      <PollCard poll={poll} />
      {isAuthor && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-base font-semibold text-foreground">Resultados por unidade</h2>
            <PollUnitBreakdown options={poll.options} breakdown={breakdown ?? {}} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
