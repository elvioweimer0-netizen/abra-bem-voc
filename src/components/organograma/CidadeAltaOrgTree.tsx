import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRole } from "@/hooks/useRole";
import type { OrgPerson, UnitOrgData } from "@/hooks/useUnitOrgData";

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

const norm = (s?: string | null) =>
  (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const cargoString = (p: OrgPerson) =>
  [p.cargo_titulo, p.cargo_text, p.cargo].map(norm).join(" | ");

function MiniCard({
  person,
  index,
  role,
  variant = "default",
}: {
  person: OrgPerson;
  index?: number;
  role?: string;
  variant?: "default" | "side";
}) {
  const navigate = useNavigate();
  const { isLider } = useRole();
  const clickable = isLider && person.user_id;
  const isAfastado = !!person.afastado_status;
  const subtitle = role ?? person.cargo_titulo ?? person.cargo_text ?? person.cargo;
  const widthCls = variant === "side" ? "w-[120px]" : "w-[130px]";
  const bgCls = variant === "side" ? "bg-muted/40" : "bg-card";

  return (
    <div
      onClick={clickable ? () => navigate(`/colaboradores/${person.user_id}`) : undefined}
      className={`relative inline-flex ${widthCls} flex-col items-center gap-1 rounded-md border ${bgCls} px-1.5 py-1.5 shadow-sm transition hover:shadow-md ${
        clickable ? "cursor-pointer hover:border-primary/40" : ""
      }`}
    >
      {isAfastado && (
        <span
          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500"
          title={`Afastado: ${person.afastado_status}`}
        />
      )}
      <div className="flex w-full items-center gap-1.5">
        {index != null && (
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
            {index}
          </span>
        )}
        <Avatar className="h-7 w-7 shrink-0">
          {person.foto_url ? <AvatarImage src={person.foto_url} alt={person.nome} /> : null}
          <AvatarFallback className={`text-[9px] ${colorFor(person.nome)}`}>
            {initials(person.nome)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[12px] font-medium">{person.nome}</p>
          {subtitle && (
            <p className="truncate text-[10px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function VacancyMini({ label, variant = "default" }: { label: string; variant?: "default" | "side" }) {
  const widthCls = variant === "side" ? "w-[120px]" : "w-[130px]";
  return (
    <div
      className={`inline-flex ${widthCls} flex-col items-center gap-1 rounded-md border border-dashed bg-muted/30 px-1.5 py-2 text-center text-muted-foreground`}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed text-[10px]">
        ?
      </div>
      <p className="text-[10px] leading-tight">{label}</p>
    </div>
  );
}

function ColumnHeader({ label }: { label: string }) {
  return (
    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
  );
}

function PersonList({
  people,
  role,
  empty,
}: {
  people: OrgPerson[];
  role?: string;
  empty?: string;
}) {
  if (people.length === 0) {
    return <p className="text-[10px] italic text-muted-foreground">{empty ?? "—"}</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {people.map((p, i) => (
        <MiniCard key={p.id} person={p} index={i + 1} role={role} />
      ))}
    </div>
  );
}

function SideBox({
  title,
  people,
  role,
}: {
  title: string;
  people: OrgPerson[];
  role?: string;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {title} {people.length > 0 && <span className="text-foreground/60">({people.length})</span>}
      </p>
      {people.length === 0 ? (
        <p className="text-[10px] italic text-muted-foreground">Vazio</p>
      ) : (
        <div className="flex flex-col gap-1">
          {people.map((p, i) => (
            <MiniCard key={p.id} person={p} index={i + 1} role={role} variant="side" />
          ))}
        </div>
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
  pacoteiro: OrgPerson | null;
  recebimento: OrgPerson[];
  limpeza: OrgPerson[];
  guarda: OrgPerson[];
  outros: OrgPerson[];
};

function classify(people: OrgPerson[]): Classified {
  const c: Classified = {
    gerente: null, encLoja: null,
    encFlv: null, encPadaria: null, encAcougue: null, encMercearia: null,
    fiscalMatutino: null, fiscalVespertino: null, fiscaisOutros: [],
    flvColabs: [], padariaColabs: [], acougueiros: [], balconistasAcougue: [],
    merceariaColabs: [], caixaColabs: [], pacoteiro: null,
    recebimento: [], limpeza: [], guarda: [], outros: [],
  };

  for (const p of people) {
    const s = cargoString(p);
    const cargo = norm(p.cargo);

    if (p.is_general_manager || cargo === "gerente" || cargo === "gerente_loja" || /gerente/.test(s)) {
      if (!c.gerente) { c.gerente = p; continue; }
    }

    if (/encarregad.*(flv|horti|fruti)/.test(s)) { if (!c.encFlv) { c.encFlv = p; continue; } }
    if (/encarregad.*padaria/.test(s)) { if (!c.encPadaria) { c.encPadaria = p; continue; } }
    if (/encarregad.*acougue/.test(s)) { if (!c.encAcougue) { c.encAcougue = p; continue; } }
    if (/encarregad.*mercearia/.test(s)) { if (!c.encMercearia) { c.encMercearia = p; continue; } }
    if (/encarregad.*loja/.test(s)) { if (!c.encLoja) { c.encLoja = p; continue; } }

    if (/fiscal.*caixa/.test(s) || (cargo === "fiscal" && /caixa/.test(s))) {
      if (/matutin/.test(s) && !c.fiscalMatutino) { c.fiscalMatutino = p; continue; }
      if (/vespertin/.test(s) && !c.fiscalVespertino) { c.fiscalVespertino = p; continue; }
      if (!c.fiscalMatutino) { c.fiscalMatutino = p; continue; }
      if (!c.fiscalVespertino) { c.fiscalVespertino = p; continue; }
      c.fiscaisOutros.push(p); continue;
    }

    if (cargo === "encarregado") {
      const setor = norm(p.setor);
      if (setor.includes("acougue") && !c.encAcougue) { c.encAcougue = p; continue; }
      if (setor.includes("padaria") && !c.encPadaria) { c.encPadaria = p; continue; }
      if ((setor.includes("hort") || setor.includes("flv")) && !c.encFlv) { c.encFlv = p; continue; }
      if (setor.includes("merce") && !c.encMercearia) { c.encMercearia = p; continue; }
      if (!c.encLoja) { c.encLoja = p; continue; }
    }

    if (/conferente|faturist|recebiment|faturament/.test(s)) { c.recebimento.push(p); continue; }
    if (/limpeza|manuten/.test(s)) { c.limpeza.push(p); continue; }
    if (/patrimonio|vigia|seguranc|guarda/.test(s)) { c.guarda.push(p); continue; }

    if (/acougueiro/.test(s)) { c.acougueiros.push(p); continue; }
    if (/balconista.*acougue|balconista de acougue/.test(s)) { c.balconistasAcougue.push(p); continue; }
    if (/atendente.*padaria|padeiro|aux.*padeiro/.test(s)) { c.padariaColabs.push(p); continue; }
    if (/repositor.*horti|aux.*hortifruti|hortifruti|flv/.test(s)) { c.flvColabs.push(p); continue; }
    if (/empacotador|pacoteiro/.test(s)) { if (!c.pacoteiro) { c.pacoteiro = p; continue; } }
    if (/operador.*caixa|caixa/.test(s)) { c.caixaColabs.push(p); continue; }
    if (/repositor|atendente.*loja|estoquista|mercearia/.test(s)) { c.merceariaColabs.push(p); continue; }

    c.outros.push(p);
  }
  return c;
}

export function CidadeAltaOrgTree({ data }: { data: UnitOrgData }) {
  const [zoom, setZoom] = useState(1);
  const c = useMemo(() => classify(data.people ?? []), [data.people]);
  const total = (data.people ?? []).length;

  const line = "bg-border";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{total} pessoa(s) — estrutura Cidade Alta</p>
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

      <div className="overflow-auto rounded-xl border bg-card p-4" style={{ maxHeight: "78vh" }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", display: "inline-block", minWidth: "100%" }}>
          <div className="flex flex-col items-center gap-3" style={{ minWidth: 920 }}>
            {/* LINHA 1 — Gerente */}
            <div>{c.gerente ? <MiniCard person={c.gerente} role="Gerente" /> : <VacancyMini label="Gerente" />}</div>
            <div className={`h-4 w-px ${line}`} />

            {/* LINHA 2 — Encarregado Loja com caixas laterais */}
            <div className="grid w-full grid-cols-[1fr_auto_1fr] items-start gap-4">
              {/* esquerda: Recebimento + Faturamento */}
              <div className="flex justify-end">
                <div className="w-[180px]">
                  <SideBox title="Recebimento + Faturamento" people={c.recebimento} role="Recebimento" />
                </div>
              </div>
              {/* centro: Encarregado Loja */}
              <div className="flex justify-center">
                {c.encLoja ? <MiniCard person={c.encLoja} role="Encarregado Loja" /> : <VacancyMini label="Encarregado Loja" />}
              </div>
              {/* direita: Limpeza + Guarda */}
              <div className="flex gap-2">
                <div className="w-[150px]">
                  <SideBox title="Limpeza" people={c.limpeza} role="Limpeza" />
                </div>
                <div className="w-[150px]">
                  <SideBox title="Guarda / Vigia" people={c.guarda} role="Guarda" />
                </div>
              </div>
            </div>

            {/* Linha vertical descendo do encarregado loja */}
            <div className={`h-4 w-px ${line}`} />
            {/* Linha horizontal cruzando as 5 colunas */}
            <div className={`h-px w-full ${line}`} style={{ maxWidth: 880 }} />

            {/* LINHA 3 — 5 COLUNAS */}
            <div className="grid w-full grid-cols-5 gap-3" style={{ minWidth: 880 }}>
              {/* COLUNA 1: FLV */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-3 w-px ${line}`} />
                <ColumnHeader label="FLV" />
                {c.encFlv ? <MiniCard person={c.encFlv} role="Enc. FLV" /> : <VacancyMini label="Enc. FLV" />}
                <div className={`h-2 w-px ${line}`} />
                <PersonList people={c.flvColabs} role="FLV" />
              </div>

              {/* COLUNA 2: PADARIA */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-3 w-px ${line}`} />
                <ColumnHeader label="Padaria" />
                {c.encPadaria ? <MiniCard person={c.encPadaria} role="Enc. Padaria" /> : <VacancyMini label="Enc. Padaria" />}
                <div className={`h-2 w-px ${line}`} />
                <PersonList people={c.padariaColabs} role="Padaria" />
              </div>

              {/* COLUNA 3: FISCAIS + OPERADORES + PACOTEIRO */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-3 w-px ${line}`} />
                <ColumnHeader label="Frente de Caixa" />
                <div className="flex gap-1">
                  {c.fiscalVespertino ? (
                    <MiniCard person={c.fiscalVespertino} role="Fiscal Vesp." />
                  ) : (
                    <VacancyMini label="Fiscal Vesp." />
                  )}
                  {c.fiscalMatutino ? (
                    <MiniCard person={c.fiscalMatutino} role="Fiscal Mat." />
                  ) : (
                    <VacancyMini label="Fiscal Mat." />
                  )}
                </div>
                {c.fiscaisOutros.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {c.fiscaisOutros.map((f) => (
                      <MiniCard key={f.id} person={f} role="Fiscal" />
                    ))}
                  </div>
                )}
                <div className={`h-2 w-px ${line}`} />
                <PersonList people={c.caixaColabs.slice(0, 10)} role="Operador" />
                {c.caixaColabs.length > 10 && (
                  <p className="text-[10px] text-muted-foreground">+ {c.caixaColabs.length - 10} operador(es)</p>
                )}
                {/* Pacoteiro com seta */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[14px] leading-none text-muted-foreground">↓</span>
                  {c.pacoteiro ? (
                    <MiniCard person={c.pacoteiro} role="Pacoteiro" />
                  ) : (
                    <VacancyMini label="Pacoteiro" />
                  )}
                </div>
              </div>

              {/* COLUNA 4: AÇOUGUE */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-3 w-px ${line}`} />
                <ColumnHeader label="Açougue" />
                {c.encAcougue ? <MiniCard person={c.encAcougue} role="Enc. Açougue" /> : <VacancyMini label="Enc. Açougue" />}
                <div className={`h-2 w-px ${line}`} />
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Açougueiros</p>
                <PersonList people={c.acougueiros.slice(0, 3)} role="Açougueiro" />
                <div className="my-1 h-px w-full bg-border/60" />
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Balconistas</p>
                <PersonList people={c.balconistasAcougue.slice(0, 3)} role="Balconista" />
              </div>

              {/* COLUNA 5: MERCEARIA */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-3 w-px ${line}`} />
                <ColumnHeader label="Mercearia" />
                {c.encMercearia ? <MiniCard person={c.encMercearia} role="Enc. Mercearia" /> : <VacancyMini label="Enc. Mercearia" />}
                <div className={`h-2 w-px ${line}`} />
                <PersonList people={c.merceariaColabs.slice(0, 3)} role="Operador" />
              </div>
            </div>

            {c.outros.length > 0 && (
              <div className="mt-3 w-full rounded-md border border-dashed bg-muted/20 p-2">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Outros ({c.outros.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {c.outros.map((p) => (
                    <MiniCard key={p.id} person={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
