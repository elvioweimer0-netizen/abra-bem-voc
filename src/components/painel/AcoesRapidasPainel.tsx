import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export type AcaoRapida = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: string;
};

interface Props {
  acoes: AcaoRapida[];
}

export function AcoesRapidasPainel({ acoes }: Props) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(acoes.length, 5)} gap-3`}>
      {acoes.map((a) => (
        <Card
          key={a.label}
          onClick={a.onClick}
          className="cursor-pointer hover:card-shadow-md hover:-translate-y-0.5 transition-all"
        >
          <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${a.tone ?? "bg-primary/10 text-primary"}`}>
              <a.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-foreground leading-tight">{a.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
