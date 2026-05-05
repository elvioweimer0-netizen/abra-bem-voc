import { useNavigate } from "react-router-dom";
import { useRecommendations } from "@/hooks/useRecommendations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, X } from "lucide-react";

export function RecomendacoesDoDia() {
  const navigate = useNavigate();
  const { items, dismiss } = useRecommendations(3);
  if (!items.length) return null;
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h2 className="flex items-center gap-2 font-bold text-foreground">
          <Lightbulb className="w-5 h-5 text-primary" /> Sugestões pra hoje
        </h2>
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{r.title}</p>
                {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {r.action_link && (
                  <Button size="sm" onClick={() => navigate(r.action_link!)} className="min-h-[40px]">
                    Fazer agora
                  </Button>
                )}
                <button onClick={() => dismiss(r.id)} aria-label="Dispensar" className="text-muted-foreground hover:text-foreground self-end">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
