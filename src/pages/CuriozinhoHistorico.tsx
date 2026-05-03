import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBriefingHistory } from "@/hooks/useBriefingHistory";

function monthOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    });
  }
  return opts;
}

export default function CuriozinhoHistorico() {
  const [month, setMonth] = useState<string>("");
  const opts = useMemo(monthOptions, []);
  const { data, isLoading } = useBriefingHistory(month || undefined);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Cartas</h1>
          <p className="text-sm text-muted-foreground">Suas cartas anteriores do Curiozinho.</p>
        </div>
        <Select value={month} onValueChange={(v) => setMonth(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[200px] capitalize"><SelectValue placeholder="Todos os meses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {opts.map((o) => <SelectItem key={o.value} value={o.value} className="capitalize">{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : !data?.length ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma carta encontrada.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">{data.length} carta{data.length > 1 ? "s" : ""}</CardTitle></CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {data.map((b) => (
                <AccordionItem key={b.id} value={b.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3 text-left">
                      <span className="capitalize">{new Date(b.briefing_date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</span>
                      {b.alerts?.length > 0 && <Badge variant="secondary">{b.alerts.length} alertas</Badge>}
                      {b.helpful === true && <Badge variant="outline">👍</Badge>}
                      {b.helpful === false && <Badge variant="outline">👎</Badge>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{b.content_markdown}</ReactMarkdown>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic mt-3">Sugestões geradas por IA. Use seu julgamento.</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
