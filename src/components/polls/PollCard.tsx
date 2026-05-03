import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Clock, BarChart3 } from "lucide-react";
import type { Poll } from "@/hooks/usePolls";
import { useMyVote, usePollResults } from "@/hooks/usePoll";
import { useVotePoll, useClosePoll } from "@/hooks/useVotePoll";
import { PollResultsBars } from "./PollResultsBars";
import { useAuth } from "@/contexts/AuthContext";

function useCountdown(target: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return "encerrada";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

interface Props { poll: Poll; compact?: boolean }

export function PollCard({ poll, compact }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const countdown = useCountdown(poll.expires_at);
  const expired = new Date(poll.expires_at).getTime() <= Date.now() || poll.status !== "ativa";
  const { data: myVote } = useMyVote(poll.id);
  const { data: results } = usePollResults(poll.id);
  const vote = useVotePoll();
  const close = useClosePoll();
  const isAuthor = user?.id === poll.author_user_id;
  const showResults = expired || !!myVote;

  return (
    <Card className="card-shadow">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              {poll.author?.nome ?? "Liderança"}{poll.unit?.name ? ` · ${poll.unit.name}` : ""}
            </p>
            <h3 className="mt-1 text-base font-semibold text-foreground">{poll.question}</h3>
          </div>
          <Badge variant={expired ? "secondary" : "default"} className="gap-1">
            {expired ? <BarChart3 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {expired ? "Encerrada" : countdown}
          </Badge>
        </div>

        {showResults ? (
          <PollResultsBars
            options={poll.options}
            counts={results?.counts ?? {}}
            total={results?.total ?? 0}
            highlightOptionId={myVote?.option_id}
          />
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {poll.options.map((o) => (
              <Button
                key={o.id}
                variant="outline"
                className="h-auto justify-start py-3 text-left"
                disabled={vote.isPending}
                onClick={() => vote.mutate({ pollId: poll.id, optionId: o.id })}
              >
                {o.label}
              </Button>
            ))}
          </div>
        )}

        {!compact && (
          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/polls/${poll.id}`)}>
              Ver detalhes
            </Button>
            {isAuthor && !expired && (
              <Button variant="ghost" size="sm" onClick={() => close.mutate(poll.id)} disabled={close.isPending}>
                Encerrar agora
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
