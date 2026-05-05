import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateOrgSolicitacao, type OrgSolicitacao } from "@/hooks/useOrgSolicitacoes";
import type { OrgPerson } from "@/hooks/useUnitOrgData";

const TIPO_LABELS: Record<OrgSolicitacao["tipo_solicitacao"], string> = {
  aumentar_quadro: "Aumentar quadro permanente",
  contratacao_emergencial: "Contratação emergencial",
  remanejamento_excedente: "Remanejamento excedente",
};

export function SolicitacaoExcedenteModal({
  open, onOpenChange, unitId, person, totalDesejado, setorAlvo, posicaoAlvo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unitId: string;
  person: OrgPerson | null;
  totalDesejado: number;
  setorAlvo?: string | null;
  posicaoAlvo?: string | null;
}) {
  const create = useCreateOrgSolicitacao();
  const [justificativa, setJustificativa] = useState("");
  const [tipo, setTipo] = useState<OrgSolicitacao["tipo_solicitacao"]>("aumentar_quadro");
  const [vendasPct, setVendasPct] = useState<string>("");
  const [rupturaHoras, setRupturaHoras] = useState<string>("");
  const [pico, setPico] = useState<string>("");
  const [outro, setOutro] = useState<string>("");

  const reset = () => {
    setJustificativa(""); setTipo("aumentar_quadro");
    setVendasPct(""); setRupturaHoras(""); setPico(""); setOutro("");
  };

  const submit = async () => {
    if (justificativa.trim().length < 50) return;
    const numeros: Record<string, any> = {};
    if (vendasPct) numeros.vendas_aumentaram_pct = Number(vendasPct);
    if (rupturaHoras) numeros.ruptura_horas_dia = Number(rupturaHoras);
    if (pico) numeros.demanda_pico = pico;
    if (outro) numeros.outro = outro;

    await create.mutateAsync({
      unit_id: unitId,
      profile_id: person?.id ?? null,
      setor_alvo: setorAlvo ?? null,
      posicao_alvo: posicaoAlvo ?? null,
      aumento_pretendido: 1,
      tipo_solicitacao: tipo,
      justificativa_texto: justificativa.trim(),
      numeros_jsonb: numeros,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar autorização do master</DialogTitle>
          <DialogDescription>
            Sua unidade já está no limite de <strong>{totalDesejado}</strong> pessoas. Pra alocar mais,
            escreva uma justificativa pro guga.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {person && (
            <div className="rounded-md border bg-muted/30 p-2 text-sm">
              <p className="font-medium">{person.nome}</p>
              <p className="text-xs text-muted-foreground">
                {person.cargo_titulo ?? person.cargo_text ?? person.cargo}
                {setorAlvo ? ` · ${setorAlvo}` : ""}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Justificativa (mín. 50 caracteres)</Label>
            <Textarea
              rows={5}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Por que você precisa dessa pessoa a mais? Explique motivo, urgência e contexto."
            />
            <p className="text-[11px] text-muted-foreground text-right">{justificativa.length}/50</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Vendas aumentaram (%)</Label>
              <Input type="number" value={vendasPct} onChange={(e) => setVendasPct(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ruptura (horas/dia)</Label>
              <Input type="number" value={rupturaHoras} onChange={(e) => setRupturaHoras(e.target.value)} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Demanda em horário de pico</Label>
              <Input value={pico} onChange={(e) => setPico(e.target.value)} placeholder="Ex.: 50% mais clientes 18h-20h" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Outro indicador</Label>
              <Input value={outro} onChange={(e) => setOutro(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={create.isPending || justificativa.trim().length < 50}>
            Enviar pro master
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
