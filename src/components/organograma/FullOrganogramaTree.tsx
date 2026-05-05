import { useMemo, useState } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonCard } from "./PersonCard";
import { VacancyCard } from "./VacancyCard";
import { EmptySectorCard } from "./EmptySectorCard";
import { useSectorTemplates } from "@/hooks/useSectorTemplates";
import type { OrgPerson, UnitOrgData } from "@/hooks/useUnitOrgData";

const PRIMARY_LINE = "hsl(var(--primary) / 0.4)";

function isManager(p: OrgPerson) {
  return p.posicao_organograma === "gerente_unidade" || p.is_general_manager === true ||
    p.cargo === "gerente_loja" || p.cargo === "gerente";
}
function isEncarregado(p: OrgPerson) {
  return p.posicao_organograma === "encarregado" || p.cargo === "encarregado";
}
function setorOf(p: OrgPerson): string {
  return (p.setor_organograma ?? p.setor ?? "").trim();
}

function sectorMatches(personSector: string, templateName: string) {
  const a = personSector.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const b = templateName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return a === b || a.includes(b) || b.includes(a);
}

function SectorBlock({
  label,
  encarregados,
  colabs,
}: {
  label: string;
  encarregados: OrgPerson[];
  colabs: OrgPerson[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (encarregados.length === 0 && colabs.length === 0) {
    return <TreeNode label={<EmptySectorCard label={label} />} />;
  }

  // Without encarregado: render a sector header box with colabs underneath
  if (encarregados.length === 0) {
    const visible = expanded ? colabs : colabs.slice(0, 5);
    const hidden = colabs.length - visible.length;
    return (
      <TreeNode label={<EmptySectorCard label={label} />}>
        {visible.map((c) => (
          <TreeNode key={c.id} label={<PersonCard person={c} compact />} />
        ))}
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
  const unit = data.unit;
  const unitKind = (unit as any)?.unit_kind ?? null;
  const { data: templates = [] } = useSectorTemplates(unitKind, unit?.id);

  const grouped = useMemo(() => {
    const people = data.people ?? [];
    const gerentes = people.filter(isManager);
    const gerenteGeral = gerentes.find((p) => p.is_general_manager) ?? gerentes[0] ?? null;
    const encarregados = people.filter(isEncarregado);
    const colabs = people.filter((p) => !isManager(p) && !isEncarregado(p));
    return { gerenteGeral, encarregados, colabs, total: people.length };
  }, [data.people]);

  if (!unit) return null;

  const root = grouped.gerenteGeral
    ? <PersonCard person={grouped.gerenteGeral} />
    : <VacancyCard label="Gerente da Unidade" cargo="gerente_loja" unitId={unit.id} />;

  // Sectors: from templates if available; otherwise derive from data
  const sectorList = templates.length > 0
    ? templates.map((t) => t.sector_name)
    : Array.from(new Set([
        ...grouped.encarregados.map(setorOf),
        ...grouped.colabs.map(setorOf),
      ].filter(Boolean))).sort();

  // Find leftover people whose sector doesn't match any template
  const matchedPersonIds = new Set<string>();
  const sections = sectorList.map((label) => {
    const enc = grouped.encarregados.filter((e) => sectorMatches(setorOf(e), label));
    const col = grouped.colabs.filter((c) => sectorMatches(setorOf(c), label));
    enc.forEach((p) => matchedPersonIds.add(p.id));
    col.forEach((p) => matchedPersonIds.add(p.id));
    return { label, encarregados: enc, colabs: col };
  });

  const leftoverEnc = grouped.encarregados.filter((e) => !matchedPersonIds.has(e.id));
  const leftoverCol = grouped.colabs.filter((c) => !matchedPersonIds.has(c.id));
  if (leftoverEnc.length || leftoverCol.length) {
    sections.push({ label: "Outros", encarregados: leftoverEnc, colabs: leftoverCol });
  }

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
            {sections.map((s) => (
              <SectorBlock
                key={s.label}
                label={s.label}
                encarregados={s.encarregados}
                colabs={s.colabs}
              />
            ))}
          </Tree>
        </div>
      </div>
    </div>
  );
}
