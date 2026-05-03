import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const DEEP_LINKS: Record<string, (unitId: string, unitCode: string) => string> = {
  advertencias: (_id, code) => `/advertencias?unit=${code}`,
  ocorrencias: (id) => `/ocorrencias?unit=${id}`,
  suspensoes: (_id, code) => `/suspensoes?unit=${code}`,
  checklist: (id) => `/checklist-diario?unit=${id}`,
  faltas: (id) => `/escala-semana?unit=${id}`,
  vagas: (id) => `/colaboradores?unit=${id}&status=vaga`,
  mood_baixo: (id) => `/clima?unit=${id}`,
  avisos_pend: () => `/avisos?urgente=1`,
};

export function HeatmapDetailDrawer({
  open,
  onClose,
  indicatorKey,
  indicatorLabel,
  unitId,
  unitCode,
  unitName,
  value,
}: {
  open: boolean;
  onClose: () => void;
  indicatorKey: string;
  indicatorLabel: string;
  unitId: string;
  unitCode: string;
  unitName: string;
  value: number;
}) {
  const navigate = useNavigate();
  const link = DEEP_LINKS[indicatorKey]?.(unitId, unitCode) ?? "/";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {indicatorLabel} · {unitName}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center">
            <div className="text-5xl font-bold text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground mt-1">{indicatorLabel.toLowerCase()}</div>
          </div>
          <p className="text-sm text-muted-foreground">
            Para ver a lista completa e tomar ação, abra a página dedicada com filtro pré-aplicado.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              navigate(link);
              onClose();
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir página completa
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
