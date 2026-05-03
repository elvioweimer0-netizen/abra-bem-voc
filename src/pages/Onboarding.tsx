import { useMyJourney } from "@/hooks/useOnboarding";
import { OnboardingTrailStep } from "@/components/onboarding/OnboardingTrailStep";
import { CertificadoCidadaoCurio } from "@/components/onboarding/CertificadoCidadaoCurio";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Onboarding() {
  const { data, isLoading } = useMyJourney();
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!data?.journey) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Você ainda não tem uma jornada de onboarding.</CardContent></Card>;
  }
  const j = data.journey;
  const pct = j.total_modules > 0 ? Math.round((j.completed_modules / j.total_modules) * 100) : 0;
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Como o Curió faz</h1>
        <p className="text-sm text-muted-foreground mt-1">Sua trilha cultural de 30 dias.</p>
      </div>

      {j.status === "concluido" ? (
        <CertificadoCidadaoCurio />
      ) : (
        <Card><CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-foreground">{j.completed_modules}/{j.total_modules} cápsulas</span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </CardContent></Card>
      )}

      <div className="space-y-0">
        {data.modules.map((m, i) => (
          <OnboardingTrailStep key={m.id} index={i} module={m} isLast={i === data.modules.length - 1} />
        ))}
        {!data.modules.length && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Ainda não há cápsulas no onboarding cultural.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
