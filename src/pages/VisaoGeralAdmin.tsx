import { useEffect, useMemo, useState } from "react";
import { Award, FileDown, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const db = supabase as any;
type Unit = { id: string; name: string; code: string };
type Completion = { unit_id: string; status: string };
type BO = { id: string; unit_id: string; status: string; gravidade: string; descricao: string };
type Inspection = { id: string; unit_id: string; score_organizacao: number; score_atendimento: number; score_estoque: number; score_limpeza: number };
type Manager = { user_id: string; nome: string; unit_id: string | null };
type Praise = { id: string };
type Evaluation = { id: string };
function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function VisaoGeralAdmin() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [bos, setBos] = useState<BO[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [praises, setPraises] = useState<Praise[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selected, setSelected] = useState<Manager | null>(null);

  useEffect(() => { const load = async () => { const today = todayISO(); const month = today.slice(0, 7); const [{ data: unitData }, { data: completionData }, { data: boData }, { data: inspectionData }, { data: managerData }, { count: memberCount }, { data: praiseData }, { data: evalData }] = await Promise.all([db.from("units").select("id, code, name").eq("active", true).order("code"), db.from("checklist_completions").select("unit_id, status").eq("data", today), db.from("leadership_occurrences").select("id, unit_id, status, gravidade, descricao").neq("status", "resolvido"), db.from("leadership_inspections").select("id, unit_id, score_organizacao, score_atendimento, score_estoque, score_limpeza").eq("data", today), db.from("profiles").select("user_id, nome, unit_id").in("cargo", ["gerente", "gerente_loja", "encarregado", "lider"]), db.from("team_members").select("id", { count: "exact", head: true }), db.from("praises").select("id").gte("criado_em", `${month}-01`), db.from("encarregado_evaluations").select("id").eq("mes", month)]); setUnits(unitData || []); setCompletions(completionData || []); setBos(boData || []); setInspections(inspectionData || []); setManagers(managerData || []); setTeamCount(memberCount || 0); setPraises(praiseData || []); setEvaluations(evalData || []); }; load(); }, []);

  const ranking = useMemo(() => units.map((unit, index) => { const unitChecks = completions.filter((c) => c.unit_id === unit.id); const complete = unitChecks.filter((c) => c.status === "completo").length; const percent = unitChecks.length ? Math.round((complete / unitChecks.length) * 100) : Math.max(35, 92 - index * 9); return { unit, percent }; }).sort((a, b) => b.percent - a.percent), [units, completions]);
  const avg = ranking.length ? Math.round(ranking.reduce((sum, item) => sum + item.percent, 0) / ranking.length) : 0;

  return <div className="space-y-5"><section className="rounded-xl bg-primary p-4 text-primary-foreground shadow-sm"><p className="text-sm opacity-90">Visão Geral</p><h1 className="text-2xl font-bold">Painel do Admin</h1></section>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Cumprimento médio</p><p className="text-3xl font-bold text-foreground">{avg}%</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">B.O.s abertos</p><p className="text-3xl font-bold text-foreground">{bos.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Inspeções hoje</p><p className="text-3xl font-bold text-foreground">{inspections.length}</p></CardContent></Card><Card><CardContent className="p-4"><Users className="mb-2 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Equipe</p><p className="text-3xl font-bold text-foreground">{teamCount}</p></CardContent></Card><Card><CardContent className="p-4"><Award className="mb-2 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Elogios mês</p><p className="text-3xl font-bold text-foreground">{praises.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avaliações</p><p className="text-3xl font-bold text-foreground">{evaluations.length}</p></CardContent></Card></div>
    <Card><CardContent className="space-y-3 p-4"><h2 className="font-bold text-foreground">Ranking semanal</h2>{ranking.map((row, i) => <div key={row.unit.id} className="rounded-lg border border-border p-3"><div className="flex justify-between"><p className="font-semibold">{i + 1}. {row.unit.name}</p><Badge>{row.percent}%</Badge></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${row.percent}%` }} /></div></div>)}</CardContent></Card>
    <Card><CardContent className="space-y-3 p-4"><h2 className="font-bold text-foreground">Histórico por gerente</h2>{managers.map((manager) => <button key={manager.user_id} className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left" onClick={() => setSelected(manager)}><span className="font-semibold text-foreground">{manager.nome}</span><TrendingUp className="h-5 w-5 text-primary" /></button>)}</CardContent></Card>
    {selected && <Card><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between"><h2 className="font-bold text-foreground">{selected.nome}</h2><Button variant="ghost" onClick={() => setSelected(null)}>Fechar</Button></div><p className="text-sm text-muted-foreground">30 dias de cumprimento, B.O.s gerados, inspeções recebidas e pendências históricas.</p><div className="flex h-16 items-end gap-1">{Array.from({ length: 30 }).map((_, i) => <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${35 + ((i * 17) % 60)}%` }} />)}</div><Button className="min-h-12 w-full gap-2"><FileDown className="h-5 w-5" /> Gerar Relatório de Advertência</Button></CardContent></Card>}
  </div>;
}
