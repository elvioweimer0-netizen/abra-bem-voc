import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { useWhatsappSummaries, useDeleteWhatsappSummary, type WhatsappSummaryPayload } from "@/hooks/useWhatsappSummary";
import { WhatsappSummaryCards } from "@/components/whatsapp/WhatsappSummaryCards";
import { useRole } from "@/hooks/useRole";

const ALLOWED = ["master", "admin", "supervisor", "gerente_loja", "gerente_adm", "gerente", "encarregado"];

export default function WhatsappResumoHistorico() {
  const { cargo } = useRole();
  const { data, isLoading } = useWhatsappSummaries();
  const del = useDeleteWhatsappSummary();

  if (!ALLOWED.includes(cargo)) return <Navigate to="/" replace />;

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/whatsapp-resumo"><ChevronLeft className="mr-1 h-4 w-4" /> Voltar</Link>
          </Button>
          <h1 className="text-3xl font-bold">Histórico de Resumos</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !data || data.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum resumo ainda.</CardContent></Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {data.map((s) => {
            const sum = (s.summary ?? { acoes: [], decisoes: [], reclamacoes: [], menos_relevantes: [] }) as WhatsappSummaryPayload;
            const total = sum.acoes.length + sum.decisoes.length + sum.reclamacoes.length + sum.menos_relevantes.length;
            const date = new Date(s.created_at);
            return (
              <AccordionItem key={s.id} value={s.id} className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 pr-2">
                    <div className="text-left">
                      <div className="font-semibold">
                        {date.toLocaleDateString("pt-BR")} <span className="text-muted-foreground font-normal">{date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{total} mensagens</div>
                    </div>
                    <div className="ml-auto flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">{sum.acoes.length} ações</Badge>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">{sum.decisoes.length} dec.</Badge>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">{sum.reclamacoes.length} rec.</Badge>
                      <Badge variant="outline">{sum.menos_relevantes.length} outras</Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <WhatsappSummaryCards summary={sum} withActions={false} />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => del.mutate(s.id)}
                      disabled={del.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Apagar
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
