import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, MessageSquare, Trash2, History, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useProcessWhatsappSummary, useDeleteWhatsappSummary, type WhatsappSummaryPayload } from "@/hooks/useWhatsappSummary";
import { WhatsappSummaryCards } from "@/components/whatsapp/WhatsappSummaryCards";
import { WhatsappAudioInput, type AudioItem } from "@/components/whatsapp/WhatsappAudioInput";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ALLOWED = ["master", "admin", "supervisor", "gerente_loja", "gerente_adm", "gerente", "encarregado"];

export default function WhatsappResumo() {
  const { cargo } = useRole();
  const [mode, setMode] = useState<"misto" | "texto" | "audio">("misto");
  const [text, setText] = useState("");
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [transcribing, setTranscribing] = useState(false);
  const [combinedTranscript, setCombinedTranscript] = useState<string>("");
  const [showRaw, setShowRaw] = useState(false);
  const [result, setResult] = useState<{ id: string; summary: WhatsappSummaryPayload } | null>(null);
  const process = useProcessWhatsappSummary();
  const del = useDeleteWhatsappSummary();

  if (!ALLOWED.includes(cargo)) return <Navigate to="/" replace />;

  const transcribeOne = async (item: AudioItem): Promise<string> => {
    const fd = new FormData();
    fd.append("file", item.file, item.file.name);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`;
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || `Falha (${r.status})`);
    }
    const j = await r.json();
    return String(j.text ?? "");
  };

  const submit = async () => {
    const useText = mode !== "audio";
    const useAudio = mode !== "texto";
    const hasText = useText && text.trim().length > 0;
    const hasAudio = useAudio && audios.length > 0;
    if (!hasText && !hasAudio) {
      toast.error("Adicione texto ou pelo menos 1 áudio");
      return;
    }

    let allTranscripts: string[] = [];
    if (hasAudio) {
      setTranscribing(true);
      const updated = [...audios];
      for (let i = 0; i < updated.length; i++) {
        updated[i] = { ...updated[i], status: "transcribing", progress: 10 };
        setAudios([...updated]);
        try {
          const t = await transcribeOne(updated[i]);
          updated[i] = { ...updated[i], status: "done", progress: 100, transcript: t };
          if (t.trim()) allTranscripts.push(`[Áudio: ${updated[i].file.name}]\n${t}`);
        } catch (e: any) {
          updated[i] = { ...updated[i], status: "error", error: e?.message ?? "falhou" };
          toast.error(`${updated[i].file.name}: ${e?.message ?? "falhou"}`);
        }
        setAudios([...updated]);
      }
      setTranscribing(false);
    }

    const combined = [
      hasText ? text.trim() : "",
      ...allTranscripts,
    ].filter(Boolean).join("\n\n---\n\n");

    if (!combined.trim()) {
      toast.error("Nenhum conteúdo para resumir");
      return;
    }
    setCombinedTranscript(combined);

    try {
      const data = await process.mutateAsync(combined);
      setResult({ id: data.id, summary: data.summary });
    } catch {
      // hook shows toast
    }
  };

  const remove = async () => {
    if (!result) return;
    await del.mutateAsync(result.id);
    setResult(null);
    setText("");
    setAudios([]);
    setCombinedTranscript("");
  };

  const busy = transcribing || process.isPending;

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" />
            Resumo do WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Cole o export, grave áudios ou suba arquivos do WhatsApp — a IA organiza tudo.
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
          Áudios são transcritos e descartados na hora — só o texto e o resumo ficam salvos no <strong>seu acesso</strong>. Apague quando quiser.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Entrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList>
              <TabsTrigger value="misto">Misto</TabsTrigger>
              <TabsTrigger value="texto">Só texto</TabsTrigger>
              <TabsTrigger value="audio">Só áudio</TabsTrigger>
            </TabsList>

            <TabsContent value="misto" className="space-y-4 mt-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole o texto do WhatsApp (opcional)..."
                className="min-h-[180px] font-mono text-sm"
                disabled={busy}
              />
              <WhatsappAudioInput items={audios} onChange={setAudios} disabled={busy} />
            </TabsContent>

            <TabsContent value="texto" className="mt-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="[03/05/2026 08:12] Ana: Bom dia! O freezer voltou a vazar..."
                className="min-h-[280px] font-mono text-sm"
                disabled={busy}
              />
            </TabsContent>

            <TabsContent value="audio" className="mt-4">
              <WhatsappAudioInput items={audios} onChange={setAudios} disabled={busy} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {text.length.toLocaleString("pt-BR")} caracteres · {audios.length} áudio(s)
            </span>
            <Button onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {transcribing ? "Transcrevendo..." : process.isPending ? "Resumindo..." : "Resumir com IA"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-xl font-semibold">Resultado</h2>
            <div className="flex gap-2">
              {combinedTranscript && (
                <Button variant="outline" size="sm" onClick={() => setShowRaw((v) => !v)}>
                  {showRaw ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showRaw ? "Ocultar transcrição" : "Ver transcrição raw"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={remove} disabled={del.isPending}>
                <Trash2 className="mr-2 h-4 w-4" /> Apagar
              </Button>
            </div>
          </div>
          {showRaw && combinedTranscript && (
            <Card>
              <CardContent className="pt-4">
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground max-h-[400px] overflow-auto">{combinedTranscript}</pre>
              </CardContent>
            </Card>
          )}
          <WhatsappSummaryCards summary={result.summary} />
        </div>
      )}
    </div>
  );
}
