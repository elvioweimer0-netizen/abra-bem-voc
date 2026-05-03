import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MessageSquare, Trash2, History, ShieldCheck } from "lucide-react";
import { useProcessWhatsappSummary, useDeleteWhatsappSummary, type WhatsappSummaryPayload } from "@/hooks/useWhatsappSummary";
import { WhatsappSummaryCards } from "@/components/whatsapp/WhatsappSummaryCards";
import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";

const ALLOWED = ["master", "admin", "supervisor", "gerente_loja", "gerente_adm", "gerente", "encarregado"];

export default function WhatsappResumo() {
  const { cargo } = useRole();
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ id: string; summary: WhatsappSummaryPayload } | null>(null);
  const process = useProcessWhatsappSummary();
  const del = useDeleteWhatsappSummary();

  if (!ALLOWED.includes(cargo)) return <Navigate to="/" replace />;

  const submit = async () => {
    if (!text.trim()) return;
    const data = await process.mutateAsync(text);
    setResult({ id: data.id, summary: data.summary });
  };

  const remove = async () => {
    if (!result) return;
    await del.mutateAsync(result.id);
    setResult(null);
    setText("");
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" />
            Resumo do WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Cole o export do dia e a IA separa em ações, decisões, reclamações e conversas.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/whatsapp-resumo/historico">
            <History className="mr-2 h-4 w-4" /> Ver histórico
          </Link>
        </Button>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          O texto é processado pela IA mas armazenado <strong>apenas no seu acesso</strong>. Nenhum colega vê seus resumos. Você pode apagar a qualquer momento.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Cole aqui o export do WhatsApp do dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="[03/05/2026 08:12] Ana: Bom dia! O freezer da padaria voltou a vazar..."
            className="min-h-[280px] font-mono text-sm"
            disabled={process.isPending}
          />
          <div className="flex justify-between items-center gap-3">
            <span className="text-xs text-muted-foreground">{text.length.toLocaleString("pt-BR")} caracteres</span>
            <Button onClick={submit} disabled={!text.trim() || process.isPending}>
              {process.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Resumir com IA
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Resultado</h2>
            <Button variant="outline" size="sm" onClick={remove} disabled={del.isPending}>
              <Trash2 className="mr-2 h-4 w-4" /> Apagar este resumo
            </Button>
          </div>
          <WhatsappSummaryCards summary={result.summary} />
        </div>
      )}
    </div>
  );
}
