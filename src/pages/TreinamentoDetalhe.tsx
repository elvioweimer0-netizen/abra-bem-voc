import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { VideoPlayer } from "@/components/treinamento/VideoPlayer";
import { QuizRunner, type QuizQuestion } from "@/components/treinamento/QuizRunner";
import { categoryLabels } from "@/components/treinamento/ModuleCard";
import { toast } from "sonner";

type Result = { score: number; correct: number; total: number; passed: boolean };

export default function TreinamentoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [videoEnded, setVideoEnded] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [phase, setPhase] = useState<"video" | "quiz" | "result">("video");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const { data: module, isLoading } = useQuery({
    queryKey: ["training-module", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("training_modules").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: questions } = useQuery({
    queryKey: ["training-questions", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("quiz_questions")
        .select("id, question_text, options, ordem")
        .eq("module_id", id)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((q: any) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] })) as QuizQuestion[];
    },
    enabled: !!id,
  });

  // Fallback: liberar quiz após 80% da duração
  const duration = module?.duration_seconds ?? 0;
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  const canStartQuiz = videoEnded || (duration > 0 && elapsed >= duration * 0.8);

  async function handleSubmit(answers: Record<string, number>) {
    setSubmitting(true);
    try {
      const { data, error } = await (supabase as any).rpc("submit_quiz", { _module_id: id, _answers: answers });
      if (error) throw error;
      setResult({ score: Number(data.score), correct: data.correct, total: data.total, passed: data.passed });
      setPhase("result");
      qc.invalidateQueries({ queryKey: ["training-modules"] });
      qc.invalidateQueries({ queryKey: ["training-history"] });
    } catch (e: any) {
      toast.error("Falha ao enviar quiz: " + (e.message ?? e));
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setResult(null);
    setPhase("quiz");
  }

  if (isLoading) return <div className="container py-6 text-sm text-muted-foreground">Carregando...</div>;
  if (!module) return <div className="container py-6">Módulo não encontrado.</div>;

  return (
    <div className="container max-w-3xl space-y-6 py-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/treinamento"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
      </Button>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">{categoryLabels[module.category] ?? module.category}</Badge>
          {!module.active && <Badge variant="secondary">Inativo</Badge>}
        </div>
        <h1 className="text-2xl font-bold">{module.title}</h1>
        {module.description && <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>}
      </div>

      {phase === "video" && (
        <>
          <VideoPlayer url={module.video_url} onEnded={() => setVideoEnded(true)} />
          <div className="flex flex-col items-end gap-2">
            <Button disabled={!canStartQuiz || (questions ?? []).length === 0} onClick={() => setPhase("quiz")}>
              Iniciar quiz
            </Button>
            {!canStartQuiz && (
              <p className="text-xs text-muted-foreground">Assista ao vídeo para liberar o quiz.</p>
            )}
          </div>
        </>
      )}

      {phase === "quiz" && questions && (
        <QuizRunner questions={questions} onSubmit={handleSubmit} submitting={submitting} />
      )}

      {phase === "result" && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.passed
                ? <><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Aprovado!</>
                : <><XCircle className="h-5 w-5 text-amber-600" /> Não foi dessa vez</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Você acertou <strong>{result.correct} de {result.total}</strong> · pontuação <strong>{result.score.toFixed(1)}%</strong>.</p>
            {result.passed ? (
              <p className="text-sm text-muted-foreground">Módulo registrado como concluído.</p>
            ) : (
              <p className="text-sm text-muted-foreground">É preciso 70% para concluir. Tente novamente.</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" asChild><Link to="/treinamento">Voltar à lista</Link></Button>
              {!result.passed && <Button onClick={retry}>Tentar de novo</Button>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
