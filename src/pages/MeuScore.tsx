import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMyScores, useScoreDimensions } from "@/hooks/useManagerScore";
import { ScoreEthicsDisclaimer } from "@/components/scores/ScoreEthicsDisclaimer";
import { ScoreHeroCard } from "@/components/scores/ScoreHeroCard";
import { ScoreTrendChart } from "@/components/scores/ScoreTrendChart";
import { ScoreDimensionCard } from "@/components/scores/ScoreDimensionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

const FOCUS_LINK: Record<string, { label: string; href: string }> = {
  disciplina_operacional: { label: "Abrir checklists", href: "/checklist-diario" },
  comunicacao: { label: "Ler avisos", href: "/avisos" },
  lideranca_ativa: { label: "Iniciar Daily", href: "/daily-huddle" },
  cumprimento_compromissos: { label: "Compromissos", href: "/compromissos" },
  cultura: { label: "Reconhecer alguém", href: "/reconhecimentos" },
  disciplina_disciplinar: { label: "Painel da equipe", href: "/minha-equipe" },
  engajamento_equipe: { label: "Equipe", href: "/minha-equipe" },
  desenvolvimento: { label: "Treinamento", href: "/treinamento" },
};

export default function MeuScore() {
  const { data: history = [] } = useMyScores(6);
  const { data: dimensions = [] } = useScoreDimensions();
  const current = history[history.length - 1];
  const previous = history[history.length - 2];

  const weakest = useMemo(() => {
    if (!current) return null;
    const items = Object.entries(current.dimension_breakdown ?? {})
      .filter(([, v]: any) => v?.status === "ok")
      .map(([code, v]: any) => ({ code, raw: v.raw }))
      .sort((a, b) => a.raw - b.raw);
    return items[0] ?? null;
  }, [current]);

  const weakestDim = weakest ? dimensions.find((d) => d.code === weakest.code) : null;
  const focusLink = weakest ? FOCUS_LINK[weakest.code] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Score</h1>
        <p className="text-sm text-muted-foreground">Indicador composto da sua gestão no mês.</p>
      </div>
      <ScoreEthicsDisclaimer />
      <ScoreHeroCard current={current} previous={previous} />
      <ScoreTrendChart scores={history} />

      {weakestDim && focusLink && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base inline-flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Onde focar essa semana
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <strong>{weakestDim.name}</strong> está em {weakest!.raw.toFixed(1)}/100. Pequenas ações já melhoram o próximo Score.
            </p>
            <Link to={focusLink.href} className="text-sm text-primary underline">{focusLink.label} →</Link>
          </CardContent>
        </Card>
      )}

      {current && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dimensions.map((d) => (
            <ScoreDimensionCard key={d.id} dimension={d} entry={current.dimension_breakdown?.[d.code]} />
          ))}
        </div>
      )}
    </div>
  );
}
