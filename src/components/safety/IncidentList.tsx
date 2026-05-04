import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { SeverityBadge, StatusBadge, TypeBadge } from "./IncidentBadges";
import type { SafetyIncident } from "@/hooks/useSafetyIncidents";

type Props = {
  incidents: SafetyIncident[];
  onSelect: (id: string) => void;
};

export function IncidentList({ incidents, onSelect }: Props) {
  if (incidents.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">Nenhum incidente encontrado.</p>;
  }
  return (
    <div className="space-y-2">
      {incidents.map((i) => (
        <Card key={i.id} className="cursor-pointer hover:bg-muted/30 transition" onClick={() => onSelect(i.id)}>
          <CardContent className="p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge value={i.incident_type} />
              <SeverityBadge value={i.severity} />
              <StatusBadge value={i.status} />
              <span className="ml-auto text-xs text-muted-foreground">
                {format(new Date(i.occurred_at), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
            <p className="text-sm text-foreground line-clamp-2">{i.description}</p>
            {i.location_in_store && (
              <p className="text-xs text-muted-foreground">📍 {i.location_in_store}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
