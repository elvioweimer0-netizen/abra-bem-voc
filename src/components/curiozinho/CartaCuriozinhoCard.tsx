import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CuriozinhoAvatar } from "./CuriozinhoAvatar";
import { useDailyBriefing } from "@/hooks/useDailyBriefing";
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, ArrowRight, History } from "lucide-react";
import { cn } from "@/lib/utils";

const sevColor: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  crit: "bg-destructive/15 text-destructive border-destructive/30",
};

export function CartaCuriozinhoCard() {
  const { data, isLoading, markOpened, markHelpful } = useDailyBriefing();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && data && !data.opened_at) markOpened.mutate(data.id);
  }, [open, data]);

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1 flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
          </div>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="card-shadow border-dashed">
        <CardContent className="p-5 flex items-center gap-3">
          <CuriozinhoAvatar className="h-10 w-10" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Sua Carta do Curiozinho chega às 6h</p>
            <p className="text-xs text-muted-foreground">Briefing diário com ações sugeridas pra sua liderança.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dateStr = new Date(data.briefing_date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Card className="card-shadow border-primary/20">
      <CardContent className="p-5 space-y-4">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3 w-full text-left">
          <CuriozinhoAvatar className="h-10 w-10" animated={open} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Carta do Curiozinho</p>
            <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
          </div>
          {data.alerts?.length > 0 && (
            <Badge variant="secondary" className="shrink-0">{data.alerts.length} alerta{data.alerts.length > 1 ? "s" : ""}</Badge>
          )}
          {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </button>

        {open && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="prose prose-sm dark:prose-invert max-w-none [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2">
              <ReactMarkdown>{data.content_markdown}</ReactMarkdown>
            </div>

            {data.alerts?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.alerts.map((a, i) => (
                  <button
                    key={i}
                    disabled={!a.link}
                    onClick={() => a.link && navigate(a.link)}
                    className={cn("text-xs px-2.5 py-1 rounded-full border", sevColor[a.severity] ?? sevColor.info, a.link && "hover:opacity-80 cursor-pointer")}
                  >{a.label}</button>
                ))}
              </div>
            )}

            {data.suggestions?.length > 0 && (
              <div className="space-y-2">
                {data.suggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-sm text-foreground line-clamp-2">{s.title}</p>
                    <Button size="sm" variant="ghost" onClick={() => navigate(s.link)}>
                      {s.action_label} <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Foi útil?</span>
                <Button
                  size="sm"
                  variant={data.helpful === true ? "default" : "outline"}
                  onClick={() => markHelpful.mutate({ id: data.id, helpful: true })}
                ><ThumbsUp className="h-3.5 w-3.5" /></Button>
                <Button
                  size="sm"
                  variant={data.helpful === false ? "default" : "outline"}
                  onClick={() => markHelpful.mutate({ id: data.id, helpful: false })}
                ><ThumbsDown className="h-3.5 w-3.5" /></Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate("/curiozinho/historico")}>
                <History className="mr-1 h-3.5 w-3.5" /> Histórico
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground italic">
              Sugestões geradas por IA. Use seu julgamento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
