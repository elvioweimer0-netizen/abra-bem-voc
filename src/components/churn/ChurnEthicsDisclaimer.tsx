import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export function ChurnEthicsDisclaimer() {
  return (
    <Alert className="border-primary/30 bg-primary/5">
      <ShieldAlert className="h-4 w-4 text-primary" />
      <AlertDescription className="text-sm">
        <strong>Sinais preditivos, não determinísticos.</strong> Sempre converse com o colaborador antes de qualquer decisão. O histórico — inclusive falsos positivos — fica registrado para auditoria. O colaborador-alvo não vê o próprio score.
      </AlertDescription>
    </Alert>
  );
}
