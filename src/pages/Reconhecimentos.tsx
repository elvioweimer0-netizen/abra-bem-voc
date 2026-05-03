import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Award, CalendarDays, ChevronDown, Heart, Medal, Megaphone, Sparkles, Star, ThumbsUp, Trophy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { availablePraiseTypes, PRAISE_TYPE_BADGE_CLASS, PRAISE_TYPE_ICON, PRAISE_TYPE_LABEL, type PraiseType } from "@/lib/praises";

const categoryLabels: Record<string, string> = {
  todos: "Todos",
  atendimento: "Atendimento",
  equipe: "Equipe",
  iniciativa: "Iniciativa",
  melhoria: "Melhoria",
  outro: "Outro",
};

const categoryIcons: Record<string, ReactNode> = {
  atendimento: <Heart className="h-4 w-4" />,
  equipe: <Users className="h-4 w-4" />,
  iniciativa: <Sparkles className="h-4 w-4" />,
  melhoria: <Star className="h-4 w-4" />,
  outro: <Award className="h-4 w-4" />,
};

const sectorLabels: Record<string, string> = {
  acougue: "Açougue",
  padaria: "Padaria",
  hortifruti: "Hortifruti",
  mercearia: "Mercearia",
  frente_caixa: "Frente de Caixa",
  deposito: "Depósito",
  geral: "Geral",
};

type Praise = {
  id: string;
  autor_id: string;
  motivo: string;
  categoria: string;
  criado_em: string;
  destinatario_id: string;
  unit_id: string;
  praise_type: PraiseType;
  team_members?: { nome?: string | null; cargo: string; sector?: string | null; foto_url?: string | null; unit_id?: string | null; units?: { name: string; code: string } | null } | null;
};

type Member = { id: string; nome?: string | null; cargo: string; unit_id: string; sector?: string | null; foto_url?: string | null; user_id?: string | null };
type Eom = { id: string; mes: string; total_praises: number; checklist_compliance_pct: number; score_final: number; team_member_id: string; team_members?: { nome?: string | null; cargo: string; sector?: string | null; foto_url?: string | null } | null; units?: { name: string; code: string } | null };
type Unit = { id: string; code: string; name: string };

type Period = "7" | "30" | "month" | "all";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function relativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.floor(diff / 36e5);
  if (hours < 1) return "agora há pouco";
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

function monthLabel(value?: string) {
  if (!value) return "mês";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
}

export default function Reconhecimentos() {
  const { user, profile } = useAuth();
  const { isAdmin, isSupervisor, cargo } = useRole();
  const { toast } = useToast();
  const [praises, setPraises] = useState<Praise[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [winners, setWinners] = useState<Eom[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [applause, setApplause] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("todos");
  const [period, setPeriod] = useState<Period>("30");
  const [unitFilter, setUnitFilter] = useState("todas");
  const [typeFilter, setTypeFilter] = useState<"todos" | PraiseType>("todos");
  const allowedTypes = availablePraiseTypes(cargo);
  const [form, setForm] = useState<{ destinatario: string; categoria: string; motivo: string; publico: boolean; praise_type: PraiseType }>({ destinatario: "", categoria: "atendimento", motivo: "", publico: true, praise_type: allowedTypes[0] });

  useEffect(() => { load(); }, []);

  async function load() {
    const db = supabase as any;
    const [{ data: p }, { data: m }, { data: e }, { data: u }, { data: a }] = await Promise.all([
      db.from("praises").select("id,autor_id,motivo,categoria,criado_em,destinatario_id,unit_id,praise_type,team_members(nome,cargo,sector,foto_url,unit_id,user_id,units(name,code))").eq("publico", true).order("criado_em", { ascending: false }).limit(80),
      db.from("team_members").select("id,nome,cargo,unit_id,sector,foto_url,user_id").eq("status", "ativo").order("nome").order("cargo"),
      db.from("employee_of_month").select("id,mes,total_praises,checklist_compliance_pct,score_final,team_member_id,team_members(nome,cargo,sector,foto_url),units(name,code)").order("mes", { ascending: false }).limit(6),
      db.from("units").select("id,code,name").order("code"),
      db.from("praise_applause").select("praise_id"),
    ]);
    setPraises(p || []);
    setMembers(m || []);
    setWinners(e || []);
    setUnits(u || []);
    const counts: Record<string, number> = {};
    (a || []).forEach((row: { praise_id: string }) => { counts[row.praise_id] = (counts[row.praise_id] || 0) + 1; });
    setApplause(counts);
  }

  const filteredPraises = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const minDate = period === "all" ? 0 : period === "month" ? monthStart : Date.now() - Number(period) * 24 * 60 * 60 * 1000;
    return praises.filter((p) => {
      const matchesCategory = category === "todos" || p.categoria === category;
      const matchesPeriod = new Date(p.criado_em).getTime() >= minDate;
      const matchesUnit = unitFilter === "todas" || p.unit_id === unitFilter;
      const matchesType = typeFilter === "todos" || (p.praise_type || "liderado") === typeFilter;
      return matchesCategory && matchesPeriod && matchesUnit && matchesType;
    });
  }, [praises, category, period, unitFilter, typeFilter]);

  const stats = useMemo(() => {
    const thisMonth = praises.filter((p) => {
      const date = new Date(p.criado_em);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const categoryCount = thisMonth.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.categoria]: (acc[p.categoria] || 0) + 1 }), {});
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "atendimento";
    return { monthPraises: thisMonth.length, topCategory: categoryLabels[topCategory], totalApplause: Object.values(applause).reduce((sum, value) => sum + value, 0) };
  }, [praises, applause]);

  async function publish() {
    const dest = members.find((m) => m.id === form.destinatario);
    if (!dest || form.motivo.trim().length < 20) { toast({ title: "Informe destinatário e motivo com 20 caracteres", variant: "destructive" }); return; }
    const db = supabase as any;
    const { error } = await db.from("praises").insert({ autor_id: user?.id, destinatario_id: dest.id, unit_id: dest.unit_id || profile?.unit_id, categoria: form.categoria, motivo: form.motivo, publico: form.publico, praise_type: form.praise_type });
    if (error) toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    else { toast({ title: "Reconhecimento publicado" }); setOpen(false); setForm({ destinatario: "", categoria: "atendimento", motivo: "", publico: true, praise_type: allowedTypes[0] }); load(); }
  }

  async function applaud(id: string) {
    const db = supabase as any;
    const { error } = await db.from("praise_applause").insert({ praise_id: id, user_id: user?.id });
    if (error) toast({ title: "Você já aplaudiu ou não tem acesso", variant: "destructive" });
    else { toast({ title: "Aplauso registrado 👏" }); setApplause((current) => ({ ...current, [id]: (current[id] || 0) + 1 })); }
  }

  const featuredWinner = winners[0];
  const featuredName = featuredWinner?.team_members?.nome || featuredWinner?.team_members?.cargo || "Funcionário";

  return <div className="space-y-4 pb-4">
    <Card className="overflow-hidden border-0 gradient-curio text-primary-foreground shadow-sm">
      <CardContent className="flex min-h-20 items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">🏆 Mural de Reconhecimentos</h1>
          <p className="text-sm opacity-90">Valorize quem faz acontecer</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="secondary" className="shrink-0 bg-card text-primary hover:bg-card/90">+ Reconhecer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Publicar elogio</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {allowedTypes.length > 1 && (
                <div>
                  <Label>Tipo de elogio</Label>
                  <Select value={form.praise_type} onValueChange={(v) => setForm({ ...form, praise_type: v as PraiseType, destinatario: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allowedTypes.map((t) => (
                        <SelectItem key={t} value={t}>{PRAISE_TYPE_ICON[t]} {PRAISE_TYPE_LABEL[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {form.praise_type === "liderado" && "Reconheça alguém que você lidera."}
                    {form.praise_type === "peer" && "Reconheça um colega de mesmo cargo na sua unidade."}
                    {form.praise_type === "equipe_externa" && "Reconheça alguém de outra equipe que você apoia."}
                  </p>
                </div>
              )}
              <div><Label>Destinatário</Label><Select value={form.destinatario} onValueChange={(destinatario) => setForm({ ...form, destinatario })}><SelectTrigger><SelectValue placeholder="Selecionar pessoa" /></SelectTrigger><SelectContent>{members.filter((m) => {
                if (m.user_id && m.user_id === user?.id) return false;
                if (form.praise_type === "peer") return m.unit_id === profile?.unit_id && !!m.user_id;
                if (form.praise_type === "equipe_externa") {
                  const perm = (profile as any)?.permission_units || [];
                  return perm.includes(m.unit_id) || isAdmin || isSupervisor;
                }
                return true;
              }).map((m) => <SelectItem key={m.id} value={m.id}>{m.nome || m.cargo}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Categoria</Label><Select value={form.categoria} onValueChange={(categoria) => setForm({ ...form, categoria })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).filter(([v]) => v !== "todos").map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Motivo</Label><Textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Mínimo 20 caracteres" /></div>
              <div className="flex items-center justify-between"><Label>Tornar público</Label><Switch checked={form.publico} onCheckedChange={(publico) => setForm({ ...form, publico })} /></div>
              <Button className="min-h-12 w-full" onClick={publish}>Publicar elogio</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>

    <Card className="border-[hsl(var(--gold)/0.45)] bg-card shadow-sm">
      <CardContent className="p-5 text-center">
        {featuredWinner ? <>
          <Avatar className="mx-auto h-20 w-20 ring-4 ring-[hsl(var(--gold)/0.22)]"><AvatarImage src={featuredWinner.team_members?.foto_url || undefined} alt={featuredName} /><AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{initials(featuredName)}</AvatarFallback></Avatar>
          <p className="mt-3 text-sm font-semibold text-[hsl(var(--gold))]">🥇 Funcionário do Mês de {monthLabel(featuredWinner.mes)}</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">{featuredName}</h2>
          <p className="text-sm text-muted-foreground">{featuredWinner.team_members?.cargo} • {sectorLabels[featuredWinner.team_members?.sector || "geral"] || "Geral"} • {featuredWinner.units?.code}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-lg bg-muted p-2 font-semibold">{featuredWinner.total_praises} elogios</div><div className="rounded-lg bg-muted p-2 font-semibold">{Number(featuredWinner.checklist_compliance_pct).toFixed(0)}% cumprimento</div></div>
          <Button variant="outline" className="mt-4 min-h-11 w-full" onClick={() => applaud(praises.find((p) => p.destinatario_id === featuredWinner.team_member_id)?.id || "")}>👏 Aplaudir</Button>
        </> : <div className="py-4"><Trophy className="mx-auto h-12 w-12 text-[hsl(var(--gold))]" /><h2 className="mt-3 text-lg font-bold text-foreground">🏁 Em disputa neste mês</h2><p className="text-sm text-muted-foreground">Quem você acha que merece?</p></div>}
      </CardContent>
    </Card>

    <div className="grid grid-cols-3 gap-2">
      <Stat icon={<Heart className="h-4 w-4" />} value={stats.monthPraises} label="elogios este mês" />
      <Stat icon={<Star className="h-4 w-4" />} value={stats.topCategory} label="top categoria" />
      <Stat icon={<ThumbsUp className="h-4 w-4" />} value={stats.totalApplause} label="aplausos" />
    </div>

    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(categoryLabels).map(([value, label]) => <Button key={value} variant={category === value ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => setCategory(value)}>{label}</Button>)}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os tipos</SelectItem><SelectItem value="liderado">{PRAISE_TYPE_ICON.liderado} {PRAISE_TYPE_LABEL.liderado}</SelectItem><SelectItem value="peer">{PRAISE_TYPE_ICON.peer} {PRAISE_TYPE_LABEL.peer}</SelectItem><SelectItem value="equipe_externa">{PRAISE_TYPE_ICON.equipe_externa} {PRAISE_TYPE_LABEL.equipe_externa}</SelectItem></SelectContent></Select>
        <Select value={period} onValueChange={(value) => setPeriod(value as Period)}><SelectTrigger><CalendarDays className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">Últimos 7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="month">Este mês</SelectItem><SelectItem value="all">Todos</SelectItem></SelectContent></Select>
        {(isAdmin || isSupervisor) && <Select value={unitFilter} onValueChange={setUnitFilter}><SelectTrigger><ChevronDown className="mr-2 h-4 w-4" /><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem>{units.map((u) => <SelectItem key={u.id} value={u.id}>{u.code}</SelectItem>)}</SelectContent></Select>}
      </div>
    </div>

    <div className="space-y-3">
      {filteredPraises.map((p) => {
        const recipient = p.team_members;
        const recipientName = recipient?.nome || recipient?.cargo || "colaborador";
        const ptype: PraiseType = (p.praise_type || "liderado") as PraiseType;
        return <Card key={p.id} className="shadow-sm"><CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-secondary/10 text-xs text-secondary">{PRAISE_TYPE_ICON[ptype]}</AvatarFallback></Avatar>
            <span>{ptype === "peer" ? "Peer reconheceu" : ptype === "equipe_externa" ? "Equipe externa reconheceu" : "Liderança elogiou"}</span>
            <Avatar className="h-8 w-8"><AvatarImage src={recipient?.foto_url || undefined} alt={recipientName} /><AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(recipientName)}</AvatarFallback></Avatar>
            <span className="font-semibold text-foreground">{recipientName}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className={`gap-1 ${PRAISE_TYPE_BADGE_CLASS[ptype]}`}>{PRAISE_TYPE_ICON[ptype]} {PRAISE_TYPE_LABEL[ptype]}</Badge>
            <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/10 text-primary">{categoryIcons[p.categoria]} {categoryLabels[p.categoria]}</Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{p.motivo}</p>
          <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{relativeDate(p.criado_em)} • {recipient?.units?.code || recipient?.units?.name || "Unidade"}</span>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => applaud(p.id)}>👏 {applause[p.id] || 0}</Button>
          </div>
        </CardContent></Card>;
      })}
      {filteredPraises.length === 0 && <Card><CardContent className="flex min-h-56 flex-col items-center justify-center p-6 text-center"><Megaphone className="h-12 w-12 text-primary" /><h2 className="mt-4 font-bold text-foreground">Nenhum elogio ainda</h2><p className="mt-1 text-sm text-muted-foreground">Seja o primeiro a reconhecer alguém!</p><Button className="mt-4" onClick={() => setOpen(true)}>+ Reconhecer agora</Button></CardContent></Card>}
    </div>
  </div>;
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return <Card className="shadow-sm"><CardContent className="p-3 text-center"><div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div><p className="mt-2 text-sm font-bold text-foreground">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></CardContent></Card>;
}
