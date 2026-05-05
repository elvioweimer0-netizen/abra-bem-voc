import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlocacaoPosicao, AlocacaoSetor, SETOR_LABELS, POSICAO_LABELS, SETORES_ORDER,
  useAllocateMutation,
} from "@/hooks/useOrgAlocacoes";
import type { OrgPerson } from "@/hooks/useUnitOrgData";

const SUB_SETORES: Record<string, string[]> = {
  ACOUGUE: ["Açougueiros", "Balconistas"],
  FRENTE_CAIXA: ["Operadores de Caixa", "Empacotadores", "Fiscais"],
};

export function AlocacaoModal({
  open, onOpenChange, person, unitId, defaultSetor, defaultPosicao, defaultSubSetor,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  person: OrgPerson | null;
  unitId: string;
  defaultSetor?: AlocacaoSetor | null;
  defaultPosicao?: AlocacaoPosicao;
  defaultSubSetor?: string | null;
}) {
  const allocate = useAllocateMutation(unitId);
  const [posicao, setPosicao] = useState<AlocacaoPosicao>(defaultPosicao ?? "colaborador");
  const [setor, setSetor] = useState<AlocacaoSetor | "">(defaultSetor ?? "");
  const [subSetor, setSubSetor] = useState<string>(defaultSubSetor ?? "");

  useEffect(() => {
    if (open) {
      setPosicao(defaultPosicao ?? "colaborador");
      setSetor((defaultSetor ?? "") as any);
      setSubSetor(defaultSubSetor ?? "");
    }
  }, [open, defaultPosicao, defaultSetor, defaultSubSetor]);

  if (!person) return null;
  const subOpts = setor && SUB_SETORES[setor] ? SUB_SETORES[setor] : [];

  const handleSubmit = async () => {
    try {
      await allocate.mutateAsync({
        profile_id: person.id,
        posicao,
        setor: posicao === "gerente_unidade" ? "GERENTE" : posicao === "encarregado_loja" ? "ENCARREGADO_LOJA" : (setor || null) as any,
        sub_setor: subSetor || null,
      });
      onOpenChange(false);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("EXCEEDS_DESIRED")) {
        // Still close so caller can react if desired; the limit only triggers on insert.
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alocar no organograma</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border bg-muted/30 p-2">
            <p className="text-sm font-medium">{person.nome}</p>
            <p className="text-xs text-muted-foreground">
              {person.cargo_titulo ?? person.cargo_text ?? person.cargo}
            </p>
          </div>
          <div className="space-y-1">
            <Label>Posição</Label>
            <Select value={posicao} onValueChange={(v) => setPosicao(v as AlocacaoPosicao)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(POSICAO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {posicao !== "gerente_unidade" && posicao !== "encarregado_loja" && (
            <div className="space-y-1">
              <Label>Setor</Label>
              <Select value={setor} onValueChange={(v) => { setSetor(v as AlocacaoSetor); setSubSetor(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione um setor" /></SelectTrigger>
                <SelectContent>
                  {SETORES_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{SETOR_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {subOpts.length > 0 && (
            <div className="space-y-1">
              <Label>Sub-setor (opcional)</Label>
              <Select value={subSetor || "__none__"} onValueChange={(v) => setSubSetor(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Nenhum —</SelectItem>
                  {subOpts.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={allocate.isPending || (posicao !== "gerente_unidade" && posicao !== "encarregado_loja" && !setor)}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
