import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyJourney } from "@/hooks/useOnboarding";

export function OnboardingProgressBanner() {
  const { profile } = useAuth();
  const { data } = useMyJourney();
  const j = data?.journey;
  if (!j || j.status === "concluido") return null;
  const pct = j.total_modules > 0 ? Math.round((j.completed_modules / j.total_modules) * 100) : 0;
  const firstName = (profile?.nome ?? "").split(" ")[0] || "Curió";
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-11 w-11 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Bem-vindo, {firstName}!</p>
            <p className="text-xs text-muted-foreground">
              Você completou {j.completed_modules} de {j.total_modules} cápsulas.
            </p>
            <Progress value={pct} className="mt-2 h-2" />
          </div>
        </div>
        <Button asChild size="sm"><Link to="/onboarding">Continuar onboarding</Link></Button>
      </CardContent>
    </Card>
  );
}
