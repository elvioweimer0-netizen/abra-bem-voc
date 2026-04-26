import { useEffect, useState } from "react";
import { Award, Medal, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type Praise = { id: string; autor_id: string; motivo: string; categoria: string; criado_em: string; destinatario_id: string; team_members?: { cargo: string } | null };
type Member = { id: string; cargo: string; unit_id: string };
type Eom = { id: string; mes: string; score_final: number; team_members?: { cargo: string } | null; units?: { name: string } | null };

export default function Reconhecimentos() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [praises, setPraises] = useState<Praise[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [winners, setWinners] = useState<Eom[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ destinatario: "", categoria: "atendimento", motivo: "", publico: true });

  useEffect(() => { load(); }, []);

  async function load() {
    const db = supabase as any;
    const [{ data: p }, { data: m }, { data: e }] = await Promise.all([
      db.from("praises").select("id,autor_id,motivo,categoria,criado_em,destinatario_id,team_members(cargo)").eq("publico", true).order("criado_em", { ascending: false }).limit(30),
      db.from("team_members").select("id,cargo,unit_id").eq("status", "ativo").order("cargo"),
      db.from("employee_of_month").select("id,mes,score_final,team_members(cargo),units(name)").order("mes", { ascending: false }).limit(6),
    ]);
    setPraises(p || []); setMembers(m || []); setWinners(e || []);
  }

  async function publish() {
    const dest = members.find((m) => m.id === form.destinatario);
    if (!dest || form.motivo.trim().length < 20) { toast({ title: "Informe destinatário e motivo com 20 caracteres", variant: "destructive" }); return; }
    const db = supabase as any;
    const { error } = await db.from("praises").insert({ autor_id: user?.id, destinatario_id: dest.id, unit_id: dest.unit_id || profile?.unit_id, categoria: form.categoria, motivo: form.motivo, publico: form.publico });
    if (error) toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    else { toast({ title: "Reconhecimento publicado" }); setOpen(false); setForm({ destinatario: "", categoria: "atendimento", motivo: "", publico: true }); load(); }
  }

  async function applaud(id: string) {
    const db = supabase as any;
    const { error } = await db.from("praise_applause").insert({ praise_id: id, user_id: user?.id });
    if (error) toast({ title: "Você já aplaudiu ou não tem acesso", variant: "destructive" });
    else toast({ title: "Aplauso registrado 👏" });
  }

  return <div className="space-y-4"><Card className="bg-primary text-primary-foreground"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm opacity-90">Mural de Reconhecimentos</p><h1 className="text-2xl font-bold">Valorize quem faz acontecer</h1></div><Award className="h-9 w-9" /></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="secondary" className="mt-4 min-h-12 w-full">+ Reconhecer alguém</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Publicar elogio</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Destinatário</Label><Select value={form.destinatario} onValueChange={(destinatario) => setForm({ ...form, destinatario })}><SelectTrigger><SelectValue placeholder="Selecionar pessoa" /></SelectTrigger><SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.cargo}</SelectItem>)}</SelectContent></Select></div><div><Label>Categoria</Label><Select value={form.categoria} onValueChange={(categoria) => setForm({ ...form, categoria })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="atendimento">Atendimento</SelectItem><SelectItem value="equipe">Equipe</SelectItem><SelectItem value="iniciativa">Iniciativa</SelectItem><SelectItem value="melhoria">Melhoria</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></div><div><Label>Motivo</Label><Textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Mínimo 20 caracteres" /></div><div className="flex items-center justify-between"><Label>Tornar público</Label><Switch checked={form.publico} onCheckedChange={(publico) => setForm({ ...form, publico })} /></div><Button className="min-h-12 w-full" onClick={publish}>Publicar elogio</Button></div></DialogContent></Dialog></CardContent></Card>{winners.length > 0 && <Card><CardContent className="p-4"><h2 className="mb-3 flex items-center gap-2 font-semibold"><Medal className="h-5 w-5 text-primary" /> Funcionários do mês</h2><div className="space-y-2">{winners.map((w) => <div key={w.id} className="rounded-lg bg-muted p-3"><p className="font-semibold text-foreground">🏆 {w.team_members?.cargo}</p><p className="text-sm text-muted-foreground">{w.units?.name} • {w.mes} • {Number(w.score_final).toFixed(0)} pts</p></div>)}</div></CardContent></Card>}<div className="space-y-3">{praises.map((p) => <Card key={p.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-2"><div><Badge>{p.categoria}</Badge><h2 className="mt-2 font-semibold text-foreground">Para {p.team_members?.cargo || "colaborador"}</h2></div><Award className="h-5 w-5 text-primary" /></div><p className="mt-3 text-sm text-foreground">{p.motivo}</p><Button variant="outline" className="mt-4 min-h-11" onClick={() => applaud(p.id)}><ThumbsUp className="mr-2 h-4 w-4" /> Aplaudir</Button></CardContent></Card>)}</div></div>;
}
