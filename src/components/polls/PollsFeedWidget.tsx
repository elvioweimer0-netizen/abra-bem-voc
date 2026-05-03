import { useEligibleActivePolls } from "@/hooks/usePolls";
import { PollCard } from "./PollCard";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export function PollsFeedWidget() {
  const { data: polls = [] } = useEligibleActivePolls();
  const navigate = useNavigate();
  if (polls.length === 0) return null;
  const top = polls.slice(0, 2);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <BarChart3 className="h-5 w-5 text-primary" /> Enquetes ativas
        </h2>
        <Button variant="ghost" size="sm" onClick={() => navigate("/polls")}>Ver todas</Button>
      </div>
      <div className="space-y-3">
        {top.map((p) => <PollCard key={p.id} poll={p} compact />)}
      </div>
    </div>
  );
}
