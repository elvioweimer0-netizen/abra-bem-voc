import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import {
  useAuditoriaResults,
  useAuditoriaItems,
  type AuditoriaPeriodo,
  type AuditoriaRow,
} from "@/hooks/useAuditoriaVisual";
import { SETORES, type SetorKey } from "@/lib/auditoriaSetores";
import { AuditoriaPhotoCard, EmptyUnitCard } from "@/components/auditoria/AuditoriaPhotoCard";
import { AuditoriaLightbox } from "@/components/auditoria/AuditoriaLightbox";

const PERIODOS: { key: AuditoriaPeriodo; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
];

type Modo = "comparativo" | "galeria" | "timeline";

export default function AuditoriaVisual() {
  const { data: units } = useAccessibleUnits();
  const [setor, setSetor] = useState<SetorKey>("todos");
  const [itemId, setItemId] = useState<string>("");
  const [periodo, setPeriodo] = useState<AuditoriaPeriodo>("hoje");
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [modo, setModo] = useState<Modo>("comparativo");
  const [selected, setSelected] = useState<AuditoriaRow | null>(null);

  const allUnitIds = useMemo(() => (units ?? []).map((u) => u.id), [units]);
  const effectiveUnitIds = unitIds.length > 0 ? unitIds : allUnitIds;

  const { data: items } = useAuditoriaItems(setor);
  const { data: rows, isLoading } = useAuditoriaResults({
    periodo,
    unitIds: effectiveUnitIds,
    itemId: itemId || null,
    setor,
  });

  // Comparativo: 1 mais recente por unidade
  const comparativoRows = useMemo(() => {
    const m = new Map<string, AuditoriaRow>();
    (rows ?? []).forEach((r) => {
      if (!r.unit_id) return;
      if (!m.has(r.unit_id)) m.set(r.unit_id, r);
    });
    return m;
  }, [rows]);

  // Timeline: 7 últimos dias por unidade
  const timelineByUnit = useMemo(() => {
    const m = new Map<string, AuditoriaRow[]>();
    (rows ?? []).forEach((r) => {
      if (!r.unit_id) return;
      const arr = m.get(r.unit_id) ?? [];
      if (arr.length < 7) arr.push(r);
      m.set(r.unit_id, arr);
    });
    return m;
  }, [rows]);

  const toggleUnit = (id: string) => {
    setUnitIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Auditoria Visual</h1>
        <p className="text-sm text-muted-foreground">Compare fotos de checklist entre lojas, lado a lado.</p>
      </div>

      {/* Filtros */}
      <div className="space-y-3 rounded-lg border bg-card p-3">
        <div className="flex flex-wrap gap-1.5">
          {SETORES.map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={setor === s.key ? "default" : "outline"}
              onClick={() => { setSetor(s.key); setItemId(""); }}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Select value={itemId || "_all"} onValueChange={(v) => setItemId(v === "_all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Item específico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos os itens com foto</SelectItem>
              {(items ?? []).map((it) => (
                <SelectItem key={it.id} value={it.id}>{it.descricao}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap gap-1.5">
            {PERIODOS.map((p) => (
              <Button
                key={p.key}
                size="sm"
                variant={periodo === p.key ? "default" : "outline"}
                onClick={() => setPeriodo(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">Unidades</p>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setUnitIds([])}>Todas</Button>
              <Button size="sm" variant="ghost" onClick={() => setUnitIds(allUnitIds)}>Selecionar todas</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(units ?? []).map((u) => {
              const active = unitIds.length === 0 || unitIds.includes(u.id);
              return (
                <Badge
                  key={u.id}
                  onClick={() => toggleUnit(u.id)}
                  className={`cursor-pointer ${active ? "" : "opacity-40"}`}
                  variant={active ? "default" : "outline"}
                >
                  {u.code}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button
            size="sm"
            variant={modo === "comparativo" ? "default" : "outline"}
            onClick={() => setModo("comparativo")}
          >
            Comparativo
          </Button>
          <Button
            size="sm"
            variant={modo === "galeria" ? "default" : "outline"}
            onClick={() => setModo("galeria")}
          >
            Galeria
          </Button>
          <Button
            size="sm"
            variant={modo === "timeline" ? "default" : "outline"}
            onClick={() => setModo("timeline")}
            disabled={!itemId}
          >
            Timeline
          </Button>
        </div>
      </div>

      {/* Resultados */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}
        </div>
      ) : (rows?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhuma foto encontrada com os filtros atuais.
        </div>
      ) : modo === "comparativo" ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(units ?? [])
            .filter((u) => effectiveUnitIds.includes(u.id))
            .map((u) => {
              const r = comparativoRows.get(u.id);
              return r ? (
                <AuditoriaPhotoCard key={u.id} row={r} onClick={() => setSelected(r)} />
              ) : (
                <EmptyUnitCard key={u.id} unitLabel={u.code} />
              );
            })}
        </div>
      ) : modo === "galeria" ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {(rows ?? []).map((r) => (
            <AuditoriaPhotoCard key={r.response_id} row={r} small onClick={() => setSelected(r)} />
          ))}
        </div>
      ) : (
        // timeline
        <div className="space-y-4">
          {(units ?? [])
            .filter((u) => effectiveUnitIds.includes(u.id))
            .map((u) => {
              const list = timelineByUnit.get(u.id) ?? [];
              return (
                <div key={u.id}>
                  <p className="mb-2 text-sm font-semibold">{u.code} · {u.name}</p>
                  {list.length === 0 ? (
                    <EmptyUnitCard unitLabel={u.code} />
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {list.map((r) => (
                        <div key={r.response_id} className="w-40 shrink-0">
                          <AuditoriaPhotoCard row={r} small onClick={() => setSelected(r)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      <AuditoriaLightbox row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
