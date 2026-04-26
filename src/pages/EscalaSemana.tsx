import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const sectors = ["acougue", "padaria", "hortifruti", "mercearia", "frente_caixa", "deposito", "geral"];
const sectorLabels: Record<string, string> = { acougue: "Açougue", padaria: "Padaria", hortifruti: "Hortifruti", mercearia: "Mercearia", frente_caixa: "Frente de Caixa", deposito: "Depósito", geral: "Geral" };
const sectorTone: Record<string, string> = { acougue: "border-primary/30 bg-primary/5", padaria: "border-warning/30 bg-warning/5", hortifruti: "border-success/30 bg-success/5", mercearia: "border-secondary/30 bg-secondary/5", frente_caixa: "border-accent/30 bg-accent/30", deposito: "border-muted-foreground/20 bg-muted", geral: "border-border bg-card" };

type Member = { id: string; cargo: string; sector: string; user_id: string | null };
type Assignment = { id: string; day_of_week: number; shift_start: string; shift_end: string; sector: string; observacao: string | null; team_members: Member | null };

export default function EscalaSemana() {
  const { profile, user } = useAuth();
  const { isGerente, isAdmin, isSupervisor } = useRole();
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [status, setStatus] = useState("rascunho");
  const [members, setMembers] = useState<Member[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [open, setOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ member: "", sector: "geral", start: "08:00", end: "17:00", day: 0, observacao: "" });
  const [motivo, setMotivo] = useState("");
  const canEdit = isGerente || isAdmin || isSupervisor;
  const weekIso = format(weekStart, "yyyy-MM-dd");

  useEffect(() => { load(); }, [weekIso, profile?.unit_id]);

  async function load() {
    if (!profile?.unit_id) return;
    const db = supabase as any;
    const [{ data: m }, { data: s }] = await Promise.all([
      db.from("team_members").select("id,cargo,sector,user_id").order("cargo"),
      db.from("work_schedules").select("id,status").eq("unit_id", profile.unit_id).eq("week_start", weekIso).maybeSingle(),
    ]);
    setMembers(m || []);
    if (s?.id) {
      setScheduleId(s.id); setStatus(s.status);
      const { data: a } = await db.from("shift_assignments").select("*, team_members(id,cargo,sector,user_id)").eq("schedule_id", s.id).order("day_of_week");
      setAssignments(a || []);
    } else { setScheduleId(null); setAssignments([]); setStatus("rascunho"); }
  }

  async function ensureSchedule() {
    if (scheduleId) return scheduleId;
    const db = supabase as any;
    const { data, error } = await db.from("work_schedules").insert({ week_start: weekIso, unit_id: profile?.unit_id, created_by: user?.id }).select("id").single();
    if (error) throw error;
    setScheduleId(data.id);
    return data.id;
  }

  async function addShift() {
    try {
      const id = await ensureSchedule();
      const db = supabase as any;
      const { error } = await db.from("shift_assignments").insert({ schedule_id: id, team_member_id: form.member, day_of_week: form.day, shift_start: form.start, shift_end: form.end, sector: form.sector, observacao: form.observacao || null });
      if (error) throw error;
      toast({ title: "Turno adicionado" }); setOpen(false); load();
    } catch (e: any) { toast({ title: "Erro ao adicionar turno", description: e.message, variant: "destructive" }); }
  }

  async function publicar() {
    if (!scheduleId) return;
    const db = supabase as any;
    const { error } = await db.from("work_schedules").update({ status: "publicada" }).eq("id", scheduleId);
    if (error) toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    else { toast({ title: "Escala publicada" }); setStatus("publicada"); }
  }

  async function solicitarTroca(assignmentId: string) {
    const mine = members.find((m) => m.user_id === user?.id);
    if (!mine) return;
    const db = supabase as any;
    const { error } = await db.from("shift_swap_requests").insert({ requester_id: mine.id, original_assignment_id: assignmentId, motivo });
    if (error) toast({ title: "Erro ao solicitar troca", description: error.message, variant: "destructive" });
    else { toast({ title: "Troca solicitada ao gerente" }); setSwapOpen(null); setMotivo(""); }
  }

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-5 w-5" /></Button><div className="text-center"><p className="text-sm text-primary">Escala da Semana</p><h1 className="text-xl font-bold text-foreground">{format(weekStart, "dd/MM")} a {format(addDays(weekStart, 6), "dd/MM")}</h1><Badge variant={status === "publicada" ? "default" : "secondary"}>{status}</Badge></div><Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-5 w-5" /></Button></div>{canEdit && <Button className="mt-4 min-h-12 w-full" onClick={publicar} disabled={!scheduleId || status === "publicada"}><Send className="mr-2 h-4 w-4" /> Publicar Escala</Button>}</CardContent></Card>
      <div className="space-y-4">
        {days.map((day, dayIndex) => <Card key={day.toISOString()}><CardContent className="p-4"><h2 className="mb-3 flex items-center gap-2 font-semibold text-foreground"><CalendarDays className="h-5 w-5 text-primary" /> {format(day, "EEEE, dd/MM", { locale: ptBR })}</h2><div className="space-y-3">{sectors.map((sector) => { const items = assignments.filter((a) => a.day_of_week === dayIndex && a.sector === sector); return <div key={sector} className={`rounded-lg border p-3 ${sectorTone[sector]}`}><div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-foreground">{sectorLabels[sector]}</span>{canEdit && <Dialog open={open && form.day === dayIndex && form.sector === sector} onOpenChange={(v) => { setOpen(v); setForm({ ...form, day: dayIndex, sector }); }}><DialogTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Plus className="h-4 w-4" /></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Adicionar turno</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Membro</Label><Select value={form.member} onValueChange={(member) => setForm({ ...form, member })}><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.cargo}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-2"><div><Label>Início</Label><Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div><div><Label>Fim</Label><Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div></div><div><Label>Observação</Label><Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></div><Button className="min-h-12 w-full" onClick={addShift}>Adicionar</Button></div></DialogContent></Dialog>}</div><div className="space-y-2">{items.map((item) => <div key={item.id} className={`rounded-md bg-card p-3 shadow-sm ${item.team_members?.user_id === user?.id ? "ring-2 ring-primary" : ""}`}><div className="flex items-center justify-between gap-2"><div><p className="font-medium text-foreground">{item.team_members?.cargo}</p><p className="text-xs text-muted-foreground">{item.shift_start.slice(0,5)}–{item.shift_end.slice(0,5)}</p></div>{!canEdit && item.team_members?.user_id === user?.id && <Dialog open={swapOpen === item.id} onOpenChange={(v) => setSwapOpen(v ? item.id : null)}><DialogTrigger asChild><Button variant="outline" size="sm">Trocar</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Solicitar troca</DialogTitle></DialogHeader><Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Explique o motivo" /><Button className="min-h-12" onClick={() => solicitarTroca(item.id)}>Enviar solicitação</Button></DialogContent></Dialog>}</div></div>)}{items.length === 0 && <p className="text-xs text-muted-foreground">Sem turnos.</p>}</div></div>; })}</div></CardContent></Card>)}
      </div>
    </div>
  );
}
