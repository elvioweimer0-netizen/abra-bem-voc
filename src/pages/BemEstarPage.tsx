import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WellbeingForm } from "@/components/wellbeing/WellbeingForm";
import { WellbeingDisclaimer } from "@/components/wellbeing/WellbeingDisclaimer";
import { useMyMonthlyCheckinStatus } from "@/hooks/useWellbeing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function BemEstarPage() {
  const { data: alreadyDone } = useMyMonthlyCheckinStatus();
  const [justSubmitted, setJustSubmitted] = useState(false);

  const showThanks = justSubmitted || alreadyDone;

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          Check-in de bem-estar
        </h1>
        <p className="text-muted-foreground mt-1">Um momento mensal pra você.</p>
      </header>

      {showThanks ? (
        <Card className="p-8 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <div>
            <p className="text-lg font-semibold">Obrigado por compartilhar.</p>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Lembre-se: você não está sozinho(a). Se precisar conversar com alguém, temos canais de apoio disponíveis a qualquer hora.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/bem-estar/recursos">Ver canais de apoio</Link>
          </Button>
        </Card>
      ) : (
        <>
          <WellbeingDisclaimer />
          <WellbeingForm onSubmitted={() => setJustSubmitted(true)} />
        </>
      )}
    </div>
  );
}
