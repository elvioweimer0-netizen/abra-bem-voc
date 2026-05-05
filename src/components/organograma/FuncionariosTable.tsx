import { useMemo, useState } from "react";
import { Search, UserPlus, MoveRight, Trash2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import type { OrgPerson } from "@/hooks/useUnitOrgData";
import {
  OrgAlocacao, SETOR_LABELS, AlocacaoSetor, useRemoveAlocacaoMutation,
} from "@/hooks/useOrgAlocacoes";
import { AlocacaoModal } from "./AlocacaoModal";

const initials = (n: string) =>
  n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

export function FuncionariosTable({
  unitId,
  people,
  alocacoes,
  onlyUnallocated = false,
}: {
  unitId: string;
  people: OrgPerson[];
  alocacoes: OrgAlocacao[];
  onlyUnallocated?: boolean;
}) {
  const navigate = useNavigate();
  const remove = useRemoveAlocacaoMutation(unitId);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "alocado" | "nao_alocado">("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [modalPerson, setModalPerson] = useState<OrgPerson | null>(null);
  const [modalDefaults, setModalDefaults] = useState<{ setor?: AlocacaoSetor | null; posicao?: any; subSetor?: string | null }>({});

  const alocByProfile = useMemo(() => {
    const m = new Map<string, OrgAlocacao>();
    for (const a of alocacoes) m.set(a.profile_id, a);
    return m;
  }, [alocacoes]);

  const filtered = useMemo(() => {
    let list = people.slice();
    if (onlyUnallocated) list = list.filter((p) => !alocByProfile.has(p.id));
    if (statusFilter === "alocado") list = list.filter((p) => alocByProfile.has(p.id));
    if (statusFilter === "nao_alocado") list = list.filter((p) => !alocByProfile.has(p.id));
    if (setorFilter !== "all") list = list.filter((p) => alocByProfile.get(p.id)?.setor === setorFilter);
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter((p) =>
        p.nome.toLowerCase().includes(qq) ||
        (p.cargo_text ?? "").toLowerCase().includes(qq) ||
        (p as any).cpf?.toString().includes(qq)
      );
    }
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [people, alocByProfile, statusFilter, setorFilter, q, onlyUnallocated]);

  const allocatedCount = people.filter((p) => alocByProfile.has(p.id)).length;
  const total = people.length;
  const pct = total > 0 ? Math.round((allocatedCount / total) * 100) : 0;

  const openAllocate = (p: OrgPerson) => {
    const cur = alocByProfile.get(p.id);
    setModalDefaults({
      setor: (cur?.setor ?? null) as any,
      posicao: cur?.posicao ?? "colaborador",
      subSetor: cur?.sub_setor ?? null,
    });
    setModalPerson(p);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3">
        <div className="text-sm">
          <span className="font-semibold">{allocatedCount} de {total}</span>{" "}
          <span className="text-muted-foreground">alocados ({pct}%)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar nome, cargo, CPF..."
              className="h-8 w-56 pl-7 text-sm"
            />
          </div>
          {!onlyUnallocated && (
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="alocado">Alocados</SelectItem>
                <SelectItem value="nao_alocado">Não alocados</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={setorFilter} onValueChange={setSetorFilter}>
            <SelectTrigger className="h-8 w-44 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {Object.entries(SETOR_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          {onlyUnallocated && people.length > 0
            ? `Todos os ${total} colaboradores estão alocados! 🎉`
            : "Nenhum colaborador encontrado."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-2"></th>
                <th className="p-2">Nome</th>
                <th className="p-2">Cargo (planilha)</th>
                <th className="p-2">CPF</th>
                <th className="p-2">Setor alocado</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const a = alocByProfile.get(p.id);
                const isAlloc = !!a;
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-2">
                      <Avatar className="h-7 w-7">
                        {p.foto_url ? <AvatarImage src={p.foto_url} /> : null}
                        <AvatarFallback className="text-[10px]">{initials(p.nome)}</AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="p-2 font-medium">{p.nome}</td>
                    <td className="p-2 text-muted-foreground">{p.cargo_titulo ?? p.cargo_text ?? "—"}</td>
                    <td className="p-2 font-mono text-xs">{(p as any).cpf ?? "—"}</td>
                    <td className="p-2">
                      {a?.setor ? (
                        <span>
                          {SETOR_LABELS[a.setor as AlocacaoSetor] ?? a.setor}
                          {a.sub_setor && <span className="text-muted-foreground"> / {a.sub_setor}</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      {isAlloc ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Alocado</Badge>
                      ) : (
                        <Badge variant="outline">Sem alocação</Badge>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openAllocate(p)}>
                          {isAlloc ? <><MoveRight className="mr-1 h-3 w-3" />Mover</> : <><UserPlus className="mr-1 h-3 w-3" />Alocar</>}
                        </Button>
                        {isAlloc && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Remover ${p.nome} do organograma?`)) remove.mutate(p.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                        {p.user_id && (
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/colaboradores/${p.user_id}`)}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AlocacaoModal
        open={!!modalPerson}
        onOpenChange={(v) => !v && setModalPerson(null)}
        person={modalPerson}
        unitId={unitId}
        defaultSetor={modalDefaults.setor}
        defaultPosicao={modalDefaults.posicao}
        defaultSubSetor={modalDefaults.subSetor}
      />
    </div>
  );
}
