import { useEffect, useMemo, useState } from "react";
import { Star, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

type Member = { id: string; cargo: string; sector: string; role: string };
const sectorLabels: Record<string, string> = { acougue: "Açougue", padaria: "Padaria", hortifruti: "Hortifruti", mercearia: "Mercearia", frente_caixa: "Frente de Caixa", deposito: "Depósito", geral: "Geral" };

function Score({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <div className="space-y-2"><div className="flex justify-between"><Label>{label}</Label><span className="flex items-center gap-1 font-semibold text-primary">{value}<Star className="h-4 w-4 fill-current" /></span></div><Slider min={1} max={5} step={1} value={[value]} onValueChange={([v]) => onChange(v)} /></div>;
}

export default function AvaliacoesEncarregados() {
  const { user } = useAuth();
  const { isGerente, isAdmin, isSupervisor } = useRole();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [scores, setScores] = useState<Record<string, any>>({});
  const canEvaluate = isGerente || isAdmin || isSupervisor;
  const mes = useMemo(() => new Date().toISOString().slice(0, 7), []);

  useEffect(() => { load(); }, []);

  async function load() {
    const db = supabase as any;
    const { data } = await db.from("team_members").select("id,cargo,sector,role").eq("role", "encarregado").eq("status", "ativo").order("cargo");
    setMembers(data || []);
  }

  function update(id: string, key: string, value: any) {
    setScores((prev) => ({ ...prev, [id]: { pontualidade: 4, atendimento: 4, postura: 4, atitude: 4, observacoes: "", ...(prev[id] || {}), [key]: value } }));
  }

  async function save(member: Member) {
    const current = { pontualidade: 4, atendimento: 4, postura: 4, atitude: 4, observacoes: "", ...(scores[member.id] || {}) };
    const db = supabase as any;
    const { error } = await db.from("encarregado_evaluations").insert({ encarregado_id: member.id, gerente_id: user?.id, mes, nota_pontualidade: current.pontualidade, nota_atendimento: current.atendimento, nota_postura: current.postura, nota_atitude: current.atitude, observacoes: current.observacoes || null });
    if (error) toast({ title: "Erro ao salvar avaliação", description: error.message, variant: "destructive" });
    else toast({ title: "Avaliação salva" });
  }

  if (!canEvaluate) return <Card><CardContent className="p-6 text-muted-foreground">Você não tem permissão para avaliar encarregados.</CardContent></Card>;

  return <div className="space-y-4"><div className="rounded-xl bg-card p-4 shadow-sm"><p className="text-sm font-medium text-primary">Avaliações</p><h1 className="text-2xl font-bold text-foreground">Encarregados — {mes}</h1><p className="text-sm text-muted-foreground">Disponível após o dia 25 de cada mês.</p></div>{members.map((member) => { const current = { pontualidade: 4, atendimento: 4, postura: 4, atitude: 4, observacoes: "", ...(scores[member.id] || {}) }; return <Card key={member.id}><CardContent className="space-y-4 p-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><UserCheck className="h-6 w-6" /></div><div><h2 className="font-semibold text-foreground">{member.cargo}</h2><Badge variant="secondary">{sectorLabels[member.sector]}</Badge></div></div><Score label="Pontualidade" value={current.pontualidade} onChange={(v) => update(member.id, "pontualidade", v)} /><Score label="Atendimento" value={current.atendimento} onChange={(v) => update(member.id, "atendimento", v)} /><Score label="Postura" value={current.postura} onChange={(v) => update(member.id, "postura", v)} /><Score label="Atitude" value={current.atitude} onChange={(v) => update(member.id, "atitude", v)} /><Textarea value={current.observacoes} onChange={(e) => update(member.id, "observacoes", e.target.value)} placeholder="Observações opcionais" /><Button className="min-h-12 w-full" onClick={() => save(member)}>Salvar avaliação</Button></CardContent></Card>; })}</div>;
}
