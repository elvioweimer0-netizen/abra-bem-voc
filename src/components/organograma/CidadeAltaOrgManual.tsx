import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, MoveRight, ExternalLink, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRole } from "@/hooks/useRole";
import type { OrgPerson, UnitOrgData } from "@/hooks/useUnitOrgData";
import {
  AlocacaoPosicao, AlocacaoSetor, OrgAlocacao,
  useOrgAlocacoes, useAllocateMutation, useRemoveAlocacaoMutation,
} from "@/hooks/useOrgAlocacoes";
import { AlocacaoModal } from "./AlocacaoModal";
import { SolicitacaoExcedenteModal } from "./SolicitacaoExcedenteModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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

function PersonCard({
  person, role, unitId, onMove,
}: { person: OrgPerson; role?: string; unitId: string; onMove: (p: OrgPerson) => void }) {
  const navigate = useNavigate();
  const remove = useRemoveAlocacaoMutation(unitId);
  const subtitle = role ?? person.cargo_titulo ?? person.cargo_text ?? person.cargo;
  const isAfastado = !!person.afastado_status;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative inline-flex w-[130px] flex-col items-center gap-1 rounded-md border bg-card px-1.5 py-1.5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
          type="button"
        >
          {isAfastado && (
            <span
              className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500"
              title={`Afastado: ${person.afastado_status}`}
            />
          )}
          <div className="flex w-full items-center gap-1.5">
            <Avatar className="h-7 w-7 shrink-0">
              {person.foto_url ? <AvatarImage src={person.foto_url} alt={person.nome} /> : null}
              <AvatarFallback className={`text-[9px] ${colorFor(person.nome)}`}>
                {initials(person.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight text-left">
              <p className="truncate text-[12px] font-medium">{person.nome}</p>
              {subtitle && <p className="truncate text-[10px] text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem onClick={() => onMove(person)}>
          <MoveRight className="mr-2 h-3.5 w-3.5" /> Mover
        </DropdownMenuItem>
        {person.user_id && (
          <DropdownMenuItem onClick={() => navigate(`/colaboradores/${person.user_id}`)}>
            <ExternalLink className="mr-2 h-3.5 w-3.5" /> Ver perfil
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            if (confirm(`Remover ${person.nome} do organograma? Vai voltar para a lista de não alocados.`)) {
              remove.mutate(person.id);
            }
          }}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir do organograma
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const SUGGESTED_BY_SETOR: Record<string, RegExp> = {
  PADARIA: /(padeiro|atendente.*padaria)/i,
  ACOUGUE: /(a[çc]ougueiro|balconista)/i,
  FLV: /(repositor.*horti|aux.*hortifr|hortifr)/i,
  FRENTE_CAIXA: /(operador.*caixa|fiscal.*caixa|empacotador)/i,
  MERCEARIA: /(repositor.*mercearia|estoquista|repositor.*bebida)/i,
  RECEBIMENTO: /(conferente|faturista)/i,
  LIMPEZA: /(aux.*limpeza|manuten[çc]|limpeza)/i,
  VIGIA: /(fiscal.*patrim|vigia|preven[çc][ãa]o.*perda)/i,
};

function isSuggested(p: OrgPerson, setorKey?: string | null): boolean {
  if (!setorKey) return false;
  const rx = SUGGESTED_BY_SETOR[setorKey];
  if (!rx) return false;
  const hay = `${p.cargo_titulo ?? ""} ${p.cargo_text ?? ""} ${(p as any).cargo ?? ""}`;
  return rx.test(hay);
}

function IncluirSlot({
  label, unallocated, onPick, suggestedKey,
}: {
  label: string;
  unallocated: OrgPerson[];
  onPick: (p: OrgPerson) => void;
  suggestedKey?: string | null;
}) {
  const sugeridos = suggestedKey ? unallocated.filter((p) => isSuggested(p, suggestedKey)) : [];
  const outros = suggestedKey ? unallocated.filter((p) => !isSuggested(p, suggestedKey)) : unallocated;

  const renderItem = (p: OrgPerson) => (
    <button
      key={p.id}
      onClick={() => onPick(p)}
      className="flex w-full items-center gap-2 rounded p-1.5 text-left hover:bg-accent"
    >
      <Avatar className="h-7 w-7">
        {p.foto_url ? <AvatarImage src={p.foto_url} /> : null}
        <AvatarFallback className={`text-[9px] ${colorFor(p.nome)}`}>{initials(p.nome)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium">{p.nome}</p>
        <p className="truncate text-[10px] text-muted-foreground">{p.cargo_titulo ?? p.cargo_text ?? "—"}</p>
      </div>
    </button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex w-[130px] flex-col items-center gap-1 rounded-md border border-dashed bg-muted/30 px-1.5 py-2 text-center text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed">
            <Plus className="h-3.5 w-3.5" />
          </div>
          <p className="text-[10px] leading-tight">Incluir<br />{label}</p>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="center">
        <p className="mb-2 px-1 text-xs font-semibold">Quem ocupa: {label}</p>
        {unallocated.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground">Nenhum funcionário sem alocação.</p>
        ) : (
          <ScrollArea className="h-72">
            <div className="space-y-1">
              {sugeridos.length > 0 && (
                <>
                  <div className="px-1 py-0.5 flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-success">Sugeridos ({sugeridos.length})</span>
                  </div>
                  {sugeridos.map(renderItem)}
                  {outros.length > 0 && <div className="my-1 h-px w-full bg-border" />}
                </>
              )}
              {outros.length > 0 && (
                <>
                  {sugeridos.length > 0 && (
                    <div className="px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Outros</div>
                  )}
                  {outros.map(renderItem)}
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ColumnHeader({ label }: { label: string }) {
  return (
    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
  );
}

function SideBox({
  title, people, unitId, unallocated, onPick, onMove, suggestedKey,
}: {
  title: string;
  people: OrgPerson[];
  unitId: string;
  unallocated: OrgPerson[];
  onPick: (p: OrgPerson) => void;
  onMove: (p: OrgPerson) => void;
  suggestedKey?: string | null;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {title} {people.length > 0 && <span className="text-foreground/60">({people.length})</span>}
      </p>
      <div className="flex flex-col gap-1">
        {people.map((p) => (
          <PersonCard key={p.id} person={p} unitId={unitId} onMove={onMove} />
        ))}
        <IncluirSlot label={title} unallocated={unallocated} onPick={onPick} suggestedKey={suggestedKey} />
      </div>
    </div>
  );
}

export function CidadeAltaOrgManual({ data }: { data: UnitOrgData }) {
  const unitId = data.unit?.id ?? "";
  const { data: alocacoes = [] } = useOrgAlocacoes(unitId);
  const allocate = useAllocateMutation(unitId);
  const [zoom, setZoom] = useState(1);
  const [modalPerson, setModalPerson] = useState<OrgPerson | null>(null);
  const [solicitState, setSolicitState] = useState<{
    person: OrgPerson | null; setor: string | null; posicao: string | null;
  } | null>(null);

  const { data: totalDesejado = 0 } = useQuery({
    queryKey: ["unit-total-desejado", unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const { data } = await (supabase as any).from("units").select("total_desejado").eq("id", unitId).maybeSingle();
      return (data?.total_desejado ?? 0) as number;
    },
  });

  const peopleById = useMemo(() => {
    const m = new Map<string, OrgPerson>();
    for (const p of data.people ?? []) m.set(p.id, p);
    return m;
  }, [data.people]);

  const allocByProfile = useMemo(() => {
    const m = new Map<string, OrgAlocacao>();
    for (const a of alocacoes) m.set(a.profile_id, a);
    return m;
  }, [alocacoes]);

  const unallocated = useMemo(
    () => (data.people ?? []).filter((p) => !allocByProfile.has(p.id)),
    [data.people, allocByProfile]
  );

  // helpers
  const bySetor = (setor: AlocacaoSetor, sub?: string | null) =>
    alocacoes
      .filter((a) => a.setor === setor && (sub ? a.sub_setor === sub : true))
      .map((a) => peopleById.get(a.profile_id))
      .filter(Boolean) as OrgPerson[];

  const byPosicao = (pos: AlocacaoPosicao) =>
    alocacoes.filter((a) => a.posicao === pos).map((a) => peopleById.get(a.profile_id)).filter(Boolean) as OrgPerson[];

  const gerente = byPosicao("gerente_unidade")[0] ?? null;
  const encLoja = byPosicao("encarregado_loja")[0] ?? null;

  const encOf = (setor: AlocacaoSetor) =>
    alocacoes
      .filter((a) => a.posicao === "encarregado_setor" && a.setor === setor)
      .map((a) => peopleById.get(a.profile_id))
      .filter(Boolean)[0] as OrgPerson | undefined ?? null;

  const colabsOf = (setor: AlocacaoSetor, sub?: string | null) =>
    alocacoes
      .filter((a) => a.posicao === "colaborador" && a.setor === setor && (sub ? a.sub_setor === sub : !a.sub_setor || sub === undefined))
      .map((a) => peopleById.get(a.profile_id))
      .filter(Boolean) as OrgPerson[];

  const allOfSetor = (setor: AlocacaoSetor) => bySetor(setor);

  const pickInto = (posicao: AlocacaoPosicao, setor: AlocacaoSetor | null, subSetor?: string | null) =>
    async (p: OrgPerson) => {
      try {
        await allocate.mutateAsync({ profile_id: p.id, posicao, setor, sub_setor: subSetor ?? null });
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        if (msg.includes("EXCEEDS_DESIRED")) {
          setSolicitState({ person: p, setor: setor ?? null, posicao });
        }
      }
    };

  const total = (data.people ?? []).length;
  const allocCount = alocacoes.length;
  const pct = total > 0 ? Math.round((allocCount / total) * 100) : 0;
  const line = "bg-border";

  const desiredStatus =
    totalDesejado > 0 && allocCount > totalDesejado ? "exceeded" :
    totalDesejado > 0 && allocCount === totalDesejado ? "full" : "ok";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-md border px-2 py-1 text-xs font-semibold",
              desiredStatus === "exceeded" && "border-destructive/40 bg-destructive/10 text-destructive",
              desiredStatus === "full" && "border-warning/40 bg-warning/10 text-warning",
              desiredStatus === "ok" && "border-success/40 bg-success/10 text-success",
            )}
          >
            {allocCount} de {totalDesejado || total} alocados
            {desiredStatus === "exceeded" && " · EXCEDIDO"}
            {desiredStatus === "full" && " · CHEIO"}
          </span>
          <span className="text-xs text-muted-foreground">{pct}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center font-mono text-xs">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(1)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border bg-card p-4" style={{ maxHeight: "78vh" }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", display: "inline-block", minWidth: "100%" }}>
          <div className="flex flex-col items-center gap-3" style={{ minWidth: 920 }}>
            {/* Gerente */}
            <div>
              {gerente
                ? <PersonCard person={gerente} role="Gerente" unitId={unitId} onMove={setModalPerson} />
                : <IncluirSlot label="Gerente" unallocated={unallocated} onPick={pickInto("gerente_unidade", "GERENTE")} />}
            </div>
            <div className={`h-4 w-px ${line}`} />

            {/* Encarregado Loja + caixas laterais */}
            <div className="grid w-full grid-cols-[1fr_auto_1fr] items-start gap-4">
              <div className="flex justify-end">
                <div className="w-[200px]">
                  <SideBox
                    title="Recebimento + Faturamento"
                    people={allOfSetor("RECEBIMENTO")}
                    unitId={unitId}
                    unallocated={unallocated}
                    onPick={pickInto("colaborador", "RECEBIMENTO")}
                    onMove={setModalPerson}
                    suggestedKey="RECEBIMENTO"
                  />
                </div>
              </div>
              <div className="flex justify-center">
                {encLoja
                  ? <PersonCard person={encLoja} role="Encarregado Loja" unitId={unitId} onMove={setModalPerson} />
                  : <IncluirSlot label="Encarregado Loja" unallocated={unallocated} onPick={pickInto("encarregado_loja", "ENCARREGADO_LOJA")} />}
              </div>
              <div className="flex gap-2">
                <div className="w-[160px]">
                  <SideBox
                    title="Limpeza"
                    people={allOfSetor("LIMPEZA")}
                    unitId={unitId}
                    unallocated={unallocated}
                    onPick={pickInto("colaborador", "LIMPEZA")}
                    onMove={setModalPerson}
                    suggestedKey="LIMPEZA"
                  />
                </div>
                <div className="w-[160px]">
                  <SideBox
                    title="Guarda / Vigia"
                    people={allOfSetor("VIGIA")}
                    unitId={unitId}
                    unallocated={unallocated}
                    onPick={pickInto("colaborador", "VIGIA")}
                    onMove={setModalPerson}
                    suggestedKey="VIGIA"
                  />
                </div>
              </div>
            </div>

            <div className={`h-4 w-px ${line}`} />
            <div className={`h-px w-full ${line}`} style={{ maxWidth: 880 }} />

            {/* 5 colunas */}
            <div className="grid w-full grid-cols-5 gap-3" style={{ minWidth: 880 }}>
              {/* FLV */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-3 w-px ${line}`} />
                <ColumnHeader label="FLV" />
                {encOf("FLV")
                  ? <PersonCard person={encOf("FLV")!} role="Enc. FLV" unitId={unitId} onMove={setModalPerson} />
                  : <IncluirSlot label="Enc. FLV" unallocated={unallocated} onPick={pickInto("encarregado_setor", "FLV")} suggestedKey="FLV" />}
                <div className={`h-2 w-px ${line}`} />
                {colabsOf("FLV").map((p) => (
                  <PersonCard key={p.id} person={p} role="FLV" unitId={unitId} onMove={setModalPerson} />
                ))}
                <IncluirSlot label="FLV" unallocated={unallocated} onPick={pickInto("colaborador", "FLV")} suggestedKey="FLV" />
              </div>

              {/* PADARIA */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-3 w-px ${line}`} />
                <ColumnHeader label="Padaria" />
                {encOf("PADARIA")
                  ? <PersonCard person={encOf("PADARIA")!} role="Enc. Padaria" unitId={unitId} onMove={setModalPerson} />
                  : <IncluirSlot label="Enc. Padaria" unallocated={unallocated} onPick={pickInto("encarregado_setor", "PADARIA")} suggestedKey="PADARIA" />}
                <div className={`h-2 w-px ${line}`} />
                {colabsOf("PADARIA").map((p) => (
                  <PersonCard key={p.id} person={p} role="Padaria" unitId={unitId} onMove={setModalPerson} />
                ))}
                <IncluirSlot label="Padaria" unallocated={unallocated} onPick={pickInto("colaborador", "PADARIA")} suggestedKey="PADARIA" />
              </div>

              {/* FRENTE DE CAIXA */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-3 w-px ${line}`} />
                <ColumnHeader label="Frente de Caixa" />
                {encOf("FRENTE_CAIXA")
                  ? <PersonCard person={encOf("FRENTE_CAIXA")!} role="Enc. Caixa" unitId={unitId} onMove={setModalPerson} />
                  : <IncluirSlot label="Enc. Caixa" unallocated={unallocated} onPick={pickInto("encarregado_setor", "FRENTE_CAIXA")} suggestedKey="FRENTE_CAIXA" />}
                <div className={`h-2 w-px ${line}`} />
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Fiscais</p>
                {bySetor("FRENTE_CAIXA", "Fiscais").map((p) => (
                  <PersonCard key={p.id} person={p} role="Fiscal" unitId={unitId} onMove={setModalPerson} />
                ))}
                <IncluirSlot label="Fiscal" unallocated={unallocated} onPick={pickInto("colaborador", "FRENTE_CAIXA", "Fiscais")} suggestedKey="FRENTE_CAIXA" />
                <div className="my-1 h-px w-full bg-border/60" />
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Operadores</p>
                {bySetor("FRENTE_CAIXA", "Operadores de Caixa").map((p) => (
                  <PersonCard key={p.id} person={p} role="Operador" unitId={unitId} onMove={setModalPerson} />
                ))}
                <IncluirSlot label="Operador" unallocated={unallocated} onPick={pickInto("colaborador", "FRENTE_CAIXA", "Operadores de Caixa")} suggestedKey="FRENTE_CAIXA" />
                <div className="my-1 h-px w-full bg-border/60" />
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Empacotadores</p>
                {bySetor("FRENTE_CAIXA", "Empacotadores").map((p) => (
                  <PersonCard key={p.id} person={p} role="Empacotador" unitId={unitId} onMove={setModalPerson} />
                ))}
                <IncluirSlot label="Empacotador" unallocated={unallocated} onPick={pickInto("colaborador", "FRENTE_CAIXA", "Empacotadores")} suggestedKey="FRENTE_CAIXA" />
              </div>

              {/* AÇOUGUE */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-3 w-px ${line}`} />
                <ColumnHeader label="Açougue" />
                {encOf("ACOUGUE")
                  ? <PersonCard person={encOf("ACOUGUE")!} role="Enc. Açougue" unitId={unitId} onMove={setModalPerson} />
                  : <IncluirSlot label="Enc. Açougue" unallocated={unallocated} onPick={pickInto("encarregado_setor", "ACOUGUE")} suggestedKey="ACOUGUE" />}
                <div className={`h-2 w-px ${line}`} />
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Açougueiros</p>
                {bySetor("ACOUGUE", "Açougueiros").map((p) => (
                  <PersonCard key={p.id} person={p} role="Açougueiro" unitId={unitId} onMove={setModalPerson} />
                ))}
                <IncluirSlot label="Açougueiro" unallocated={unallocated} onPick={pickInto("colaborador", "ACOUGUE", "Açougueiros")} suggestedKey="ACOUGUE" />
                <div className="my-1 h-px w-full bg-border/60" />
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Balconistas</p>
                {bySetor("ACOUGUE", "Balconistas").map((p) => (
                  <PersonCard key={p.id} person={p} role="Balconista" unitId={unitId} onMove={setModalPerson} />
                ))}
                <IncluirSlot label="Balconista" unallocated={unallocated} onPick={pickInto("colaborador", "ACOUGUE", "Balconistas")} suggestedKey="ACOUGUE" />
              </div>

              {/* MERCEARIA */}
              <div className="flex flex-col items-center gap-2">
                <div className={`h-3 w-px ${line}`} />
                <ColumnHeader label="Mercearia" />
                {encOf("MERCEARIA")
                  ? <PersonCard person={encOf("MERCEARIA")!} role="Enc. Mercearia" unitId={unitId} onMove={setModalPerson} />
                  : <IncluirSlot label="Enc. Mercearia" unallocated={unallocated} onPick={pickInto("encarregado_setor", "MERCEARIA")} suggestedKey="MERCEARIA" />}
                <div className={`h-2 w-px ${line}`} />
                {colabsOf("MERCEARIA").map((p) => (
                  <PersonCard key={p.id} person={p} role="Mercearia" unitId={unitId} onMove={setModalPerson} />
                ))}
                <IncluirSlot label="Mercearia" unallocated={unallocated} onPick={pickInto("colaborador", "MERCEARIA")} suggestedKey="MERCEARIA" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlocacaoModal
        open={!!modalPerson}
        onOpenChange={(v) => !v && setModalPerson(null)}
        person={modalPerson}
        unitId={unitId}
        defaultPosicao={modalPerson ? (allocByProfile.get(modalPerson.id)?.posicao ?? "colaborador") : "colaborador"}
        defaultSetor={modalPerson ? ((allocByProfile.get(modalPerson.id)?.setor as AlocacaoSetor | undefined) ?? null) : null}
        defaultSubSetor={modalPerson ? (allocByProfile.get(modalPerson.id)?.sub_setor ?? null) : null}
      />
      <SolicitacaoExcedenteModal
        open={!!solicitState}
        onOpenChange={(v) => !v && setSolicitState(null)}
        unitId={unitId}
        person={solicitState?.person ?? null}
        totalDesejado={totalDesejado}
        setorAlvo={solicitState?.setor ?? null}
        posicaoAlvo={solicitState?.posicao ?? null}
      />
    </div>
  );
}
