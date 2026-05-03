import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function ScoreEthicsDisclaimer() {
  return (
    <Alert className="border-primary/30 bg-primary/5">
      <Info className="h-4 w-4 text-primary" />
      <AlertDescription className="text-sm">
        <strong>O Score é insumo de avaliação, não veredicto.</strong> A conversa contextual continua essencial pra decisões de RH.
      </AlertDescription>
    </Alert>
  );
}
