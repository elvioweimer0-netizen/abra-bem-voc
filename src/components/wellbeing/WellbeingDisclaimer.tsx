import { Shield, Heart, Info } from "lucide-react";
import { Link } from "react-router-dom";

export function WellbeingDisclaimer() {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3 text-sm text-muted-foreground">
      <div className="flex items-start gap-2">
        <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <p>
          <span className="font-semibold text-foreground">Anônimo e protegido.</span>{" "}
          Suas respostas individuais nunca são vistas por colegas, gestores ou pelo RH. Só agregados (no mínimo 5 pessoas) são analisados.
        </p>
      </div>
      <div className="flex items-start gap-2">
        <Heart className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <p>
          <span className="font-semibold text-foreground">Sem julgamento.</span>{" "}
          Não existe resposta certa. Esse check-in nos ajuda a cuidar melhor de você e da equipe.
        </p>
      </div>
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <p>
          <span className="font-semibold text-foreground">Não substitui acompanhamento profissional.</span>{" "}
          Se precisar conversar agora, veja os{" "}
          <Link to="/bem-estar/recursos" className="underline text-primary">canais de apoio</Link>.
        </p>
      </div>
    </div>
  );
}
