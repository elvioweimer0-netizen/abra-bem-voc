import { useMemo, useState } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonCard } from "./PersonCard";
import { VacancyCard } from "./VacancyCard";
import type { OrgPerson, UnitOrgData } from "@/hooks/useUnitOrgData";

const PRIMARY_LINE = "hsl(var(--primary) / 0.4)";

const SETOR_LABELS: Record<string, string> = {
  PADARIA: "Padaria",
  ACOUGUE: "Açougue",
  FRENTE_CAIXA: "Frente de Caixa",
  REPOSICAO: "Reposição / Hortifruti",
  RECEBIMENTO: "Recebimento",
  LIMPEZA: "Limpeza",
  PREVENCAO: "Prevenção",
  PRODUCAO: "Produção",
  LOGISTICA: "Logística",
  TI: "TI",
  ADM: "Administrativo",
  OUTROS: "Outros",
};

function isManager(p: OrgPerson) {
  return p.posicao_organograma === "gerente_unidade" || p.is_general_manager === true ||
    p.cargo === "gerente_loja" || p.cargo === "gerente";
}
function isEncarregado(p: OrgPerson) {
  return p.posicao_organograma === "encarregado" || p.cargo === "encarregado";
}

function setorOf(p: OrgPerson): string {
  return p.setor_organograma ?? p.setor ?? "OUTROS";
}

function SectorBlock({
  setor,
  encarregados,
  colabs,
  unitId,
}: {
  setor: string;
  encarregados: OrgPerson[];
  colabs: OrgPerson[];
  unitId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleColabs = expanded ? colabs : colabs.slice(0, 5);
  const hidden = colabs.length - visibleColabs.length;

  const renderColabs = () =>
    visibleColabs.map((c) => (
      <TreeNode key={c.id} label={<PersonCard person={c} compact />} />
    ));

  if (encarregados.length === 0) {
    return (
      <TreeNode
        label={<VacancyCard label={SETOR_LABELS[setor] ?? setor} cargo="encarregado" setor={setor as any} unitId={unitId} />}
      >
        {renderColabs()}
        {hidden > 0 && (
          <TreeNode
            label={
              <button
                onClick={() => setExpanded(true)}
                className="rounded-lg border bg-muted px-3 py-2 text-xs font-medium hover:bg-muted/70"
              >
                + Ver mais {hidden} pessoas
              </button>
            }
          />
        )}
      </TreeNode>
    );
  }

  // Distribute colaboradores under their lider_setor_id when matched, otherwise under first encarregado
  return (
    <>
      {encarregados.map((enc, idx) => {
        const own = colabs.filter((c) => c.lider_setor_id === enc.id);
        const orphan = idx === 0 ? colabs.filter((c) => !encarregados.find((e) => e.id === c.lider_setor_id)) : [];
        const list = [...own, ...orphan];
        const visible = expanded ? list : list.slice(0, 5);
        const remaining = list.length - visible.length;
        return (
          <TreeNode key={enc.id} label={<PersonCard person={enc} />}>
            {visible.map((c) => (
              <TreeNode key={c.id} label={<PersonCard person={c} compact />} />
            ))}
            {remaining > 0 && (
              <TreeNode
                label={
                  <button
                    onClick={() => setExpanded(true)}
                    className="rounded-lg border bg-muted px-3 py-2 text-xs font-medium hover:bg-muted/70"
                  >
                    + Ver mais {remaining} pessoas
                  </button>
                }
              />
            )}
          </TreeNode>
        );
      })}
    </>
  );
}

export function FullOrganogramaTree({ data }: { data: UnitOrgData }) {
  const [zoom, setZoom] = useState(1);

  const grouped = useMemo(() => {
    const people = data.people ?? [];
    const gerentes = people.filter(isManager);
    const gerenteGeral = gerentes.find((p) => p.is_general_manager) ?? gerentes[0] ?? null;

    const encarregados = people.filter(isEncarregado);
    const colabs = people.filter((p) => !isManager(p) && !isEncarregado(p));

    const setores = new Set<string>([
      ...encarregados.map(setorOf),
      ...colabs.map(setorOf),
    ]);

    const bySetor = Array.from(setores)
      .filter(Boolean)
      .map((s) => ({
        setor: s,
        encarregados: encarregados.filter((e) => setorOf(e) === s),
        colabs: colabs.filter((c) => setorOf(c) === s),
      }))
      .sort((a, b) => (SETOR_LABELS[a.setor] ?? a.setor).localeCompare(SETOR_LABELS[b.setor] ?? b.setor));

    return { gerenteGeral, bySetor, total: people.length };
  }, [data.people]);

  if (!data.unit) return null;
  const unit = data.unit;

  const root = grouped.gerenteGeral
    ? <PersonCard person={grouped.gerenteGeral} />
    : <VacancyCard label="Gerente da Unidade" cargo="gerente_loja" unitId={unit.id} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{grouped.total} pessoa(s) nesta unidade</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} aria-label="Diminuir zoom">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} aria-label="Aumentar zoom">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(1)} aria-label="Resetar zoom">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-auto rounded-xl border bg-card p-4" style={{ maxHeight: "70vh" }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", display: "inline-block" }}>
          <Tree lineWidth="2px" lineColor={PRIMARY_LINE} lineBorderRadius="8px" label={root}>
            {grouped.bySetor.map((s) => (
              <SectorBlock
                key={s.setor}
                setor={s.setor}
                encarregados={s.encarregados}
                colabs={s.colabs}
                unitId={unit.id}
              />
            ))}
          </Tree>
        </div>
      </div>
    </div>
  );
}
