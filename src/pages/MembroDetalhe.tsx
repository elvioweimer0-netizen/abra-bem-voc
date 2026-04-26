import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Award, Edit, MessageCircle, Star, ThumbsUp, UserRound } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

type TeamMember = { id: string; user_id: string | null; unit_id: string; sector: string; role: string; cargo: string; telefone: string | null; status: string; foto_url: string | null; units?: { name: string } | null };
type Praise = { id: string; motivo: string; categoria: string; criado_em: string };
type Evaluation = { id: string; mes: string; nota_geral: number; observacoes: string | null };

const sectorLabels: Record<string, string> = { acougue: "Açougue", padaria: "Padaria", hortifruti: "Hortifruti", mercearia: "Mercearia", frente_caixa: "Frente de Caixa", deposito: "Depósito", geral: "Geral" };

export default function MembroDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();
  const { isGerente, isAdmin, isSupervisor } = useRole();
  const { toast } = useToast();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [praises, setPraises] = useState<Praise[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [praise, setPraise] = useState({ categoria: "atendimento", motivo: "", publico: true });
  const canManage = isGerente || isAdmin || isSupervisor;

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    const db = supabase as any;
    const [{ data: memberData }, { data: praiseData }, { data: evalData }] = await Promise.all([
      db.from("team_members").select("*, units(name)").eq("id", id).maybeSingle(),
      db.from("praises").select("id, motivo, categoria, criado_em").eq("destinatario_id", id).order("criado_em", { ascending: false }).limit(10),
      db.from("encarregado_evaluations").select("id, mes, nota_geral, observacoes").eq("encarregado_id", id).order("mes", { ascending: false }).limit(12),
    ]);
    setMember(memberData);
    setPraises(praiseData || []);
    setEvaluations(evalData || []);
  }

  async function publicarElogio() {
    if (!member || praise.motivo.trim().length < 20) {
      toast({ title: "Escreva um motivo com pelo menos 20 caracteres", variant: "destructive" });
      return;
    }
    const db = supabase as any;
    const { error } = await db.from("praises").insert({ autor_id: user?.id, destinatario_id: member.id, unit_id: member.unit_id, categoria: praise.categoria, motivo: praise.motivo, publico: praise.publico });
    if (error) toast({ title: "Erro ao publicar elogio", description: error.message, variant: "destructive" });
    else { toast({ title: "Elogio publicado" }); setPraise({ categoria: "atendimento", motivo: "", publico: true }); fetchData(); }
  }

  if (!member) return <div className="text-muted-foreground">Carregando membro...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-9 w-9" /></div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground">{member.cargo}</h1>
              <p className="text-sm text-muted-foreground">{member.units?.name} • {sectorLabels[member.sector]}</p>
              <div className="mt-2 flex flex-wrap gap-2"><Badge>{member.role}</Badge><Badge variant="outline">{member.status}</Badge></div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {member.telefone && <Button variant="outline" className="min-h-12" asChild><a href={`https://wa.me/${member.telefone}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</a></Button>}
            {canManage && <Button variant="outline" className="min-h-12"><Edit className="mr-2 h-4 w-4" /> Editar</Button>}
            {member.role === "encarregado" && canManage && <Button className="min-h-12"><Star className="mr-2 h-4 w-4" /> Avaliar</Button>}
            <Dialog>
              <DialogTrigger asChild><Button className="min-h-12"><ThumbsUp className="mr-2 h-4 w-4" /> Elogiar</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Publicar elogio</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Categoria</Label><Select value={praise.categoria} onValueChange={(categoria) => setPraise({ ...praise, categoria })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="atendimento">Atendimento</SelectItem><SelectItem value="equipe">Equipe</SelectItem><SelectItem value="iniciativa">Iniciativa</SelectItem><SelectItem value="melhoria">Melhoria</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></div>
                  <div><Label>Motivo</Label><Textarea value={praise.motivo} onChange={(e) => setPraise({ ...praise, motivo: e.target.value })} placeholder="Descreva o reconhecimento com detalhes" /></div>
                  <div className="flex items-center justify-between"><Label>Tornar público</Label><Switch checked={praise.publico} onCheckedChange={(publico) => setPraise({ ...praise, publico })} /></div>
                  <Button className="min-h-12 w-full" onClick={publicarElogio}>Publicar elogio</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card><CardContent className="p-4"><h2 className="mb-3 font-semibold text-foreground">Cumprimento — últimos 30 dias</h2><div className="grid grid-cols-10 gap-1">{Array.from({ length: 30 }).map((_, i) => <div key={i} className="h-8 rounded bg-muted" />)}</div></CardContent></Card>
      <Card><CardContent className="p-4"><h2 className="mb-3 font-semibold text-foreground">Avaliações recebidas</h2>{evaluations.length ? evaluations.map((e) => <div key={e.id} className="border-b border-border py-3 last:border-0"><div className="flex justify-between"><span>{e.mes}</span><Badge>{Number(e.nota_geral).toFixed(1)}</Badge></div>{e.observacoes && <p className="mt-1 text-sm text-muted-foreground">{e.observacoes}</p>}</div>) : <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada.</p>}</CardContent></Card>
      <Card><CardContent className="p-4"><h2 className="mb-3 flex items-center gap-2 font-semibold text-foreground"><Award className="h-5 w-5 text-primary" /> Elogios recebidos</h2>{praises.length ? praises.map((p) => <div key={p.id} className="border-b border-border py-3 last:border-0"><Badge variant="secondary">{p.categoria}</Badge><p className="mt-2 text-sm text-foreground">{p.motivo}</p></div>) : <p className="text-sm text-muted-foreground">Nenhum elogio ainda.</p>}</CardContent></Card>
    </div>
  );
}
