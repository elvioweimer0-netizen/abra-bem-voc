import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateSafetyIncident,
  type IncidentType,
  type IncidentSeverity,
} from "@/hooks/useSafetyIncidents";

const TYPES: { value: IncidentType; label: string }[] = [
  { value: "quase_acidente", label: "Quase-acidente (prevenção)" },
  { value: "queda", label: "Queda" },
  { value: "corte", label: "Corte" },
  { value: "queimadura", label: "Queimadura" },
  { value: "choque_eletrico", label: "Choque elétrico" },
  { value: "exposicao_quimica", label: "Exposição química" },
  { value: "assalto", label: "Assalto" },
  { value: "outro", label: "Outro" },
];

const SEVERITIES: { value: IncidentSeverity; label: string }[] = [
  { value: "quase_acidente", label: "Quase-acidente (sem dano)" },
  { value: "leve", label: "Leve" },
  { value: "moderado", label: "Moderado" },
  { value: "grave", label: "Grave" },
  { value: "muito_grave", label: "Muito grave" },
];

type Props = {
  trigger?: React.ReactNode;
  defaultUnitId?: string;
};

export function ReportIncidentDialog({ trigger, defaultUnitId }: Props) {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const { data: units } = useAccessibleUnits();
  const create = useCreateSafetyIncident();

  const initialUnit = defaultUnitId || (profile as any)?.unit_id || "";

  const [unit, setUnit] = useState(initialUnit);
  const [incidentType, setIncidentType] = useState<IncidentType>("quase_acidente");
  const [severity, setSeverity] = useState<IncidentSeverity>("quase_acidente");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [occurredAt, setOccurredAt] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const reset = () => {
    setIncidentType("quase_acidente");
    setSeverity("quase_acidente");
    setLocation("");
    setDescription("");
    setFiles(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unit || !description.trim() || !occurredAt) return;
    await create.mutateAsync({
      unit_id: unit,
      incident_type: incidentType,
      severity,
      description: description.trim(),
      occurred_at: new Date(occurredAt).toISOString(),
      location_in_store: location.trim() || null,
      photoFiles: files ? Array.from(files) : undefined,
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-2">
            <ShieldAlert className="h-4 w-4" /> Incidente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar incidente de segurança</DialogTitle>
        </DialogHeader>

        <Badge variant="secondary" className="w-fit gap-1">
          <ShieldAlert className="h-3 w-3" /> Quase-acidente conta como prevenção 🛡️
        </Badge>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unidade</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(units ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.code} — {u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quando ocorreu</Label>
              <Input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={incidentType} onValueChange={(v) => setIncidentType(v as IncidentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gravidade</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as IncidentSeverity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Local na loja</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="ex: padaria perto do forno" />
          </div>

          <div>
            <Label>O que aconteceu *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o ocorrido"
              rows={3}
              required
              maxLength={1000}
            />
          </div>

          <div>
            <Label>Foto (opcional)</Label>
            <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
          </div>

          <Button type="submit" disabled={create.isPending} className="w-full">
            {create.isPending ? "Enviando…" : "Registrar incidente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
