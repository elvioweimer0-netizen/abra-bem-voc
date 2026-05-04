import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSafetyIncident, useUpdateSafetyIncident, getSafetyPhotoUrl, type IncidentStatus } from "@/hooks/useSafetyIncidents";
import { SeverityBadge, StatusBadge, TypeBadge } from "./IncidentBadges";
import { format } from "date-fns";

type Props = {
  incidentId: string | null;
  onClose: () => void;
};

export function IncidentDetailDialog({ incidentId, onClose }: Props) {
  const { data: inc } = useSafetyIncident(incidentId || undefined);
  const update = useUpdateSafetyIncident();
  const [rootCause, setRootCause] = useState("");
  const [actionCorrective, setActionCorrective] = useState("");
  const [status, setStatus] = useState<IncidentStatus>("aberto");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    if (inc) {
      setRootCause(inc.root_cause ?? "");
      setActionCorrective(inc.action_corrective ?? "");
      setStatus(inc.status);
      Promise.all((inc.photos ?? []).map(getSafetyPhotoUrl))
        .then((urls) => setPhotoUrls(urls.filter(Boolean) as string[]));
    }
  }, [inc]);

  if (!incidentId) return null;

  return (
    <Dialog open={!!incidentId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do incidente</DialogTitle>
        </DialogHeader>

        {!inc ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <TypeBadge value={inc.incident_type} />
              <SeverityBadge value={inc.severity} />
              <StatusBadge value={inc.status} />
            </div>

            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Quando:</span> {format(new Date(inc.occurred_at), "dd/MM/yyyy HH:mm")}</p>
              {inc.location_in_store && <p><span className="text-muted-foreground">Local:</span> {inc.location_in_store}</p>}
              <p className="whitespace-pre-wrap"><span className="text-muted-foreground">Descrição:</span> {inc.description}</p>
              {inc.action_immediate && <p><span className="text-muted-foreground">Ação imediata:</span> {inc.action_immediate}</p>}
            </div>

            {photoUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photoUrls.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer">
                    <img src={u} alt="" className="rounded border h-24 w-full object-cover" />
                  </a>
                ))}
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold">Investigação</h4>
              <div>
                <Label>Causa raiz</Label>
                <Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Ação corretiva</Label>
                <Textarea value={actionCorrective} onChange={(e) => setActionCorrective(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as IncidentStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="investigando">Investigando</SelectItem>
                    <SelectItem value="corrigido">Corrigido</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => update.mutate({
                  id: inc.id,
                  root_cause: rootCause,
                  action_corrective: actionCorrective,
                  status,
                })}
                disabled={update.isPending}
              >
                {update.isPending ? "Salvando…" : "Salvar investigação"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
