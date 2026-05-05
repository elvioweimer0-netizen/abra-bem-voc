import { useMemo, useState } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import { useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRole } from "@/hooks/useRole";
import type { OrgPerson, UnitOrgData } from "@/hooks/useUnitOrgData";

const PRIMARY_LINE = "hsl(var(--primary) / 0.4)";

const initials = (n: string) =>
  n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

const colorFor = (n: string) => {
  const palette = [
    "bg-orange-200 text-orange-800",
    "bg-blue-200 text-blue-800",
    "bg-emerald-200 text-emerald-800",
    "bg-purple-200 text-purple-800",
    "bg-rose-200 text-rose-800",
    "bg-amber-200 text-amber-800",
  ];
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

function norm(s?: string | null) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cargoString(p: OrgPerson) {
  return [p.cargo_titulo, p.cargo_text, p.cargo].map(norm).join(" | ");
}

function MiniCard({ person, role }: { person: OrgPerson; role?: string }) {
  const navigate = useNavigate();
  const { isLider } = useRole();
  const clickable = isLider && person.user_id;
  const isAfastado = !!person.afastado_status;
  const subtitle = role ?? person.cargo_titulo ?? person.cargo_text ?? person.cargo;

  return (
    <div
      onClick={clickable ? () => navigate(`/colaboradores/${person.user_id}`) : undefined}
      className={`relative inline-flex w-[140px] flex-col items-center gap-1 rounded-lg border bg-card px-2 py-2 shadow-sm transition hover:shadow-md ${
        clickable ? "cursor-pointer hover:border-primary/40" : ""
      }`}
    >
      {isAfastado && (
        <span
          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500"
          title={`Afastado: ${person.afastado_status}`}
        />
      )}
      <Avatar className="h-8 w-8">
        {person.foto_url ? <AvatarImage src={person.foto_url} alt={person.nome} /> : null}
        <AvatarFallback className={`text-[10px] ${colorFor(person.nome)}`}>
          {initials(person.nome)}
        </AvatarFallback>
      </Avatar>
      <div className="text-center leading-tight">
        <p className="text-[13px] font-medium line-clamp-2">{person.nome}</p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function VacancyMini({ label }: { label: string }) {
  return (
    <div className="inline-flex w-[140px] flex-col items-center gap-1 rounded-lg border border-dashed bg-muted/30 px-2 py-2 text-muted-foreground">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed text-[10px]">
        ?
      </div>
      <p className="text-[11px] text-center leading-tight">{label}</p>
    </div>
  );
}

function GroupBox({
  title,
  people,
  emptyHint,
  max,
}: {
  title: string;
  people: OrgPerson[];
  emptyHint?: string;
  max?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const list = max && !expanded ? people.slice(0, max) : people;
  const remaining = people.length - list.length;
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-lg border bg-card/50 p-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title} {people.length > 0 && <span className="text-foreground/60">({people.length})</span>}
      </p>
      {people.length === 0 ? (
        <p className="text-[11px] italic text-muted-foreground">{emptyHint ?? "Vazio"}</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {list.map((p) => (
            <MiniCard key={p.id} person={p} />
          ))}
        </div>
      )}
      {remaining > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="rounded border bg-muted px-2 py-0.5 text-[11px] hover:bg-muted/70"
        >
          + ver {remaining}
        </button>
      )}
    </div>
  );
}

type Classified = {
  gerente: OrgPerson | null;
  encLoja: OrgPerson | null;
  encFlv: OrgPerson | null;
  encPadaria: OrgPerson | null;
  encAcougue: OrgPerson | null;
  encMercearia: OrgPerson | null;
  fiscalMatutino: OrgPerson | null;
  fiscalVespertino: OrgPerson | null;
  fiscaisOutros: OrgPerson[];
  flvColabs: OrgPerson[];
  padariaColabs: OrgPerson[];
  acougueiros: OrgPerson[];
  balconistasAcougue: OrgPerson[];
  merceariaColabs: OrgPerson[];
  caixaColabs: OrgPerson[];
  recebimento: OrgPerson[];
  limpeza: OrgPerson[];
  guarda: OrgPerson[];
  outros: OrgPerson[];
};

function classify(people: OrgPerson[]): Classified {
  const c: Classified = {
    gerente: null,
    encLoja: null,
    encFlv: null,
    encPadaria: null,
    encAcougue: null,
    encMercearia: null,
    fiscalMatutino: null,
    fiscalVespertino: null,
    fiscaisOutros: [],
    flvColabs: [],
    padariaColabs: [],
    acougueiros: [],
    balconistasAcougue: [],
    merceariaColabs: [],
    caixaColabs: [],
    recebimento: [],
    limpeza: [],
    guarda: [],
    outros: [],
  };

  for (const p of people) {
    const s = cargoString(p);
    const cargo = norm(p.cargo);

    // Gerente
    if (p.is_general_manager || cargo === "gerente" || cargo === "gerente_loja" || /gerente/.test(s)) {
      if (!c.gerente) {
        c.gerente = p;
        continue;
      }
    }

    // Encarregados de setor (specific) — check before generic
    if (/encarregad.*(flv|horti|fruti)/.test(s) || /enc.*horti/.test(s)) {
      if (!c.encFlv) { c.encFlv = p; continue; }
    }
    if (/encarregad.*padaria/.test(s)) {
      if (!c.encPadaria) { c.encPadaria = p; continue; }
    }
    if (/encarregad.*acougue/.test(s)) {
      if (!c.encAcougue) { c.encAcougue = p; continue; }
    }
    if (/encarregad.*mercearia/.test(s)) {
      if (!c.encMercearia) { c.encMercearia = p; continue; }
    }
    if (/encarregad.*loja/.test(s)) {
      if (!c.encLoja) { c.encLoja = p; continue; }
    }

    // Fiscal de caixa with periodo
    if (/fiscal.*caixa/.test(s) || (cargo === "fiscal" && /caixa/.test(s))) {
      if (/matutin/.test(s) && !c.fiscalMatutino) { c.fiscalMatutino = p; continue; }
      if (/vespertin/.test(s) && !c.fiscalVespertino) { c.fiscalVespertino = p; continue; }
      if (!c.fiscalMatutino) { c.fiscalMatutino = p; continue; }
      if (!c.fiscalVespertino) { c.fiscalVespertino = p; continue; }
      c.fiscaisOutros.push(p);
      continue;
    }

    // Generic encarregado fallback by setor
    if (cargo === "encarregado") {
      const setor = norm(p.setor);
      if (setor.includes("acougue") && !c.encAcougue) { c.encAcougue = p; continue; }
      if (setor.includes("padaria") && !c.encPadaria) { c.encPadaria = p; continue; }
      if ((setor.includes("hort") || setor.includes("flv")) && !c.encFlv) { c.encFlv = p; continue; }
      if (setor.includes("merce") && !c.encMercearia) { c.encMercearia = p; continue; }
      if (!c.encLoja) { c.encLoja = p; continue; }
    }

    // Caixa lateral groups
    if (/conferente|faturist|recebiment|faturament/.test(s)) { c.recebimento.push(p); continue; }
    if (/limpeza|manuten/.test(s)) { c.limpeza.push(p); continue; }
    if (/patrimonio|vigia|seguranc|guarda/.test(s)) { c.guarda.push(p); continue; }

    // Setor colabs
    if (/acougueiro/.test(s)) { c.acougueiros.push(p); continue; }
    if (/balconista.*acougue|balconista de acougue/.test(s)) { c.balconistasAcougue.push(p); continue; }
    if (/atendente.*padaria|padeiro|aux.*padeiro/.test(s)) { c.padariaColabs.push(p); continue; }
    if (/repositor.*horti|aux.*hortifruti|hortifruti|flv/.test(s)) { c.flvColabs.push(p); continue; }
    if (/operador.*caixa|empacotador|pacoteiro|caixa/.test(s)) { c.caixaColabs.push(p); continue; }
    if (/repositor|atendente.*loja|estoquista|mercearia/.test(s)) { c.merceariaColabs.push(p); continue; }

    c.outros.push(p);
  }
  return c;
}

export function CidadeAltaOrgTree({ data }: { data: UnitOrgData }) {
  const [zoom, setZoom] = useState(1);
  const c = useMemo(() => classify(data.people ?? []), [data.people]);

  const root = c.gerente ? <MiniCard person={c.gerente} role="Gerente" /> : <VacancyMini label="Gerente" />;

  // Encarregado Loja node, with lateral cards as siblings inside same TreeNode label
  const encLojaLabel = (
    <div className="inline-flex items-start gap-3">
      <div className="flex flex-col items-center gap-2">
        {c.encLoja ? <MiniCard person={c.encLoja} role="Encarregado Loja" /> : <VacancyMini label="Encarregado Loja" />}
      </div>
      <div className="flex flex-col gap-2">
        <GroupBox title="Recebimento + Faturamento" people={c.recebimento} max={4} />
        <GroupBox title="Limpeza" people={c.limpeza} max={4} />
        <GroupBox title="Guarda / Vigia" people={c.guarda} max={4} />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {(data.people ?? []).length} pessoa(s) — estrutura Cidade Alta
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} aria-label="Diminuir zoom">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center font-mono text-xs">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} aria-label="Aumentar zoom">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(1)} aria-label="Resetar zoom">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border bg-card p-4" style={{ maxHeight: "75vh" }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", display: "inline-block" }}>
          <Tree lineWidth="2px" lineColor={PRIMARY_LINE} lineBorderRadius="6px" label={root}>
            <TreeNode label={encLojaLabel}>
              {/* FLV */}
              <TreeNode
                label={c.encFlv ? <MiniCard person={c.encFlv} role="Enc. FLV" /> : <VacancyMini label="Enc. FLV" />}
              >
                <TreeNode label={<GroupBox title="FLV" people={c.flvColabs} max={3} emptyHint="Sem colaboradores" />} />
              </TreeNode>

              {/* Padaria */}
              <TreeNode
                label={c.encPadaria ? <MiniCard person={c.encPadaria} role="Enc. Padaria" /> : <VacancyMini label="Enc. Padaria" />}
              >
                <TreeNode label={<GroupBox title="Padaria" people={c.padariaColabs} max={6} />} />
              </TreeNode>

              {/* Açougue */}
              <TreeNode
                label={c.encAcougue ? <MiniCard person={c.encAcougue} role="Enc. Açougue" /> : <VacancyMini label="Enc. Açougue" />}
              >
                <TreeNode label={<GroupBox title="Açougueiros" people={c.acougueiros} max={3} />} />
                <TreeNode label={<GroupBox title="Balconistas" people={c.balconistasAcougue} max={3} />} />
              </TreeNode>

              {/* Mercearia */}
              <TreeNode
                label={c.encMercearia ? <MiniCard person={c.encMercearia} role="Enc. Mercearia" /> : <VacancyMini label="Enc. Mercearia" />}
              >
                <TreeNode label={<GroupBox title="Mercearia" people={c.merceariaColabs} max={3} />} />
              </TreeNode>

              {/* Frente de Caixa — fiscais lado a lado */}
              <TreeNode
                label={
                  <div className="inline-flex flex-col items-center gap-2 rounded-lg border bg-card/50 p-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Frente de Caixa
                    </p>
                    <div className="flex gap-2">
                      {c.fiscalMatutino ? (
                        <MiniCard person={c.fiscalMatutino} role="Fiscal Matutino" />
                      ) : (
                        <VacancyMini label="Fiscal Matutino" />
                      )}
                      {c.fiscalVespertino ? (
                        <MiniCard person={c.fiscalVespertino} role="Fiscal Vespertino" />
                      ) : (
                        <VacancyMini label="Fiscal Vespertino" />
                      )}
                      {c.fiscaisOutros.map((f) => (
                        <MiniCard key={f.id} person={f} role="Fiscal" />
                      ))}
                    </div>
                  </div>
                }
              >
                <TreeNode label={<GroupBox title="Operadores + Pacoteiro" people={c.caixaColabs} max={11} />} />
              </TreeNode>
            </TreeNode>
          </Tree>

          {c.outros.length > 0 && (
            <div className="mt-4 rounded-lg border border-dashed bg-muted/20 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Outros ({c.outros.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {c.outros.map((p) => (
                  <MiniCard key={p.id} person={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
