import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useCreatePoll } from "@/hooks/useVotePoll";

const HOUR_PRESETS = [1, 4, 12, 24];
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "colaborador", label: "Colaboradores" },
  { value: "lider_setor", label: "Líderes de setor" },
  { value: "encarregado", label: "Encarregados" },
  { value: "gerente_loja", label: "Gerentes de loja" },
  { value: "gerente_adm", label: "Gerentes adm" },
  { value: "supervisor", label: "Supervisores" },
];

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export function NovaPollModal({ open, onOpenChange }: Props) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [hours, setHours] = useState<number>(4);
  const [roles, setRoles] = useState<string[]>([]);
  const create = useCreatePoll();

  function reset() {
    setQuestion(""); setOptions(["", ""]); setHours(4); setRoles([]);
  }

  function addOption() { if (options.length < 4) setOptions([...options, ""]); }
  function removeOption(i: number) { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); }
  function updateOption(i: number, v: string) { setOptions(options.map((o, idx) => (idx === i ? v : o))); }
  function toggleRole(r: string) { setRoles(roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r]); }

  async function submit() {
    const cleanOptions = options.map((l, i) => ({ id: `opt_${i + 1}`, label: l.trim() })).filter((o) => o.label);
    if (question.trim().length < 5 || cleanOptions.length < 2) return;
    await create.mutateAsync({
      question,
      options: cleanOptions,
      hours,
      target_roles: roles,
      unit_id: null,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova enquete rápida</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Pergunta</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
              placeholder="O que você quer perguntar pra equipe?"
              rows={2}
            />
            <p className="mt-1 text-xs text-muted-foreground">{question.length}/200</p>
          </div>

          <div>
            <Label>Opções (2 a 4)</Label>
            <div className="mt-1 space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={o} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Opção ${i + 1}`} />
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOption(i)}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              {options.length < 4 && (
                <Button variant="outline" size="sm" onClick={addOption}><Plus className="mr-1 h-3 w-3" /> Adicionar opção</Button>
              )}
            </div>
          </div>

          <div>
            <Label>Prazo</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {HOUR_PRESETS.map((h) => (
                <Badge
                  key={h}
                  variant={hours === h ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setHours(h)}
                >
                  {h}h
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Cargos elegíveis (vazio = todos)</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <Badge
                  key={r.value}
                  variant={roles.includes(r.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleRole(r.value)}
                >
                  {r.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={create.isPending || question.trim().length < 5 || options.filter((o) => o.trim()).length < 2}>
            Publicar enquete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
