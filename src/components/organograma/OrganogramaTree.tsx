import { Tree, TreeNode } from "react-organizational-chart";
import { PersonCard } from "./PersonCard";
import { VacancyCard } from "./VacancyCard";
import { detectUnitKind, getExpectedSlots, SETOR_LABELS, type ExpectedSlot } from "@/config/orgExpectations";
import type { OrgPerson, UnitOrgData } from "@/hooks/useUnitOrgData";

const PRIMARY_LINE = "hsl(var(--primary) / 0.4)";

function findPerson(people: OrgPerson[], match: (p: OrgPerson) => boolean): OrgPerson | undefined {
  return people.find(match);
}

function PlaceholderRoot({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border bg-card px-4 py-2 text-sm font-semibold">{children}</div>;
}

export function OrganogramaTree({ data }: { data: UnitOrgData }) {
  if (!data.unit) return null;
  const unit = data.unit;
  const kind = detectUnitKind(unit.code, unit.type);
  const people = data.people;
  const slots = getExpectedSlots(kind);

  if (kind === "central_adm") {
    const gerentes = slots.filter((s) => s.cargo === "gerente_adm");
    return (
      <Tree
        lineWidth="2px"
        lineColor={PRIMARY_LINE}
        lineBorderRadius="8px"
        label={<PlaceholderRoot>{unit.name}</PlaceholderRoot>}
      >
        {gerentes.map((slot) => {
          const person = findPerson(people, (p) =>
            p.cargo === "gerente_adm" &&
            ((p.gerencia ?? "").toLowerCase() === (slot.gerencia ?? "").toLowerCase() ||
              (p.cargo_titulo ?? "").toLowerCase().includes((slot.gerencia ?? "").toLowerCase()))
          );
          return (
            <TreeNode key={slot.gerencia} label={
              person
                ? <PersonCard person={person} />
                : <VacancyCard label={slot.label} cargo="gerente_adm" gerencia={slot.gerencia} unitId={unit.id} />
            } />
          );
        })}
      </Tree>
    );
  }

  // Loja / CP / CD
  const gerente = findPerson(people, (p) => p.cargo === "gerente_loja" || p.cargo === "gerente");
  const fiscais = people.filter((p) => p.cargo === "fiscal");
  const fiscalSlot = slots.find((s) => s.cargo === "fiscal");
  const setoresSlots = slots.filter((s) => s.cargo === "encarregado");

  const root = gerente
    ? <PersonCard person={gerente} />
    : <VacancyCard label="Gerente da Unidade" cargo="gerente_loja" unitId={unit.id} />;

  return (
    <Tree lineWidth="2px" lineColor={PRIMARY_LINE} lineBorderRadius="8px" label={root}>
      {/* Fiscal — ramo lateral conectado ao gerente */}
      {fiscais.length > 0
        ? fiscais.map((f) => <TreeNode key={f.id} label={<PersonCard person={f} />} />)
        : fiscalSlot && <TreeNode label={<VacancyCard label="Fiscal" cargo="fiscal" unitId={unit.id} />} />}

      {setoresSlots.map((slot) => {
        const setorKey = slot.setor!;
        const encarregados = people.filter((p) => p.cargo === "encarregado" && p.setor === setorKey);
        const lideres = people.filter((p) => p.cargo === "lider_setor" && p.setor === setorKey);
        const colaboradoresDoSetor = people.filter((p) => p.cargo === "colaborador" && p.setor === setorKey);

        const renderEncarregadoNode = (enc: OrgPerson | null) => {
          const encNode = enc ? <PersonCard person={enc} /> : (
            <VacancyCard label={slot.label} cargo="encarregado" setor={setorKey} unitId={unit.id} />
          );

          // Líderes sob esse encarregado (na prática um setor → 1 enc; agrupamos todos os líderes do setor sob ele)
          const liderSlot = kind === "loja" ? slots.find((s) => s.cargo === "lider_setor" && s.setor === setorKey) : null;
          const liderNodes = lideres.length > 0
            ? lideres.map((lid) => {
                const colabsDoLider = colaboradoresDoSetor.filter((c) => c.lider_setor_id === lid.id);
                return (
                  <TreeNode key={lid.id} label={<PersonCard person={lid} compact />}>
                    {colabsDoLider.map((c) => (
                      <TreeNode key={c.id} label={<PersonCard person={c} compact />} />
                    ))}
                  </TreeNode>
                );
              })
            : liderSlot
              ? [<TreeNode key="vac-lider" label={<VacancyCard label={liderSlot.label} cargo="lider_setor" setor={setorKey} unitId={unit.id} compact />} />]
              : [];

          // Colaboradores sem líder atribuído → direto sob encarregado
          const colabsSemLider = colaboradoresDoSetor.filter((c) => !c.lider_setor_id || !lideres.find((l) => l.id === c.lider_setor_id));
          const colabSemLiderNodes = colabsSemLider.map((c) => (
            <TreeNode key={c.id} label={<PersonCard person={c} compact />} />
          ));

          return (
            <TreeNode key={enc?.id ?? `vac-${setorKey}`} label={encNode}>
              {[...liderNodes, ...colabSemLiderNodes]}
            </TreeNode>
          );
        };

        if (encarregados.length === 0) return renderEncarregadoNode(null);
        return <>{encarregados.map((enc) => renderEncarregadoNode(enc))}</>;
      })}
    </Tree>
  );
}
