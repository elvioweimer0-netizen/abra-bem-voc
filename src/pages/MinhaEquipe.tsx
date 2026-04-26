import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, MessageCircle, ClipboardCheck, UserCheck, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type TeamMember = {
  id: string;
  user_id: string | null;
  unit_id: string;
  sector: string;
  role: string;
  cargo: string;
  foto_url: string | null;
  telefone: string | null;
  data_admissao: string | null;
  status: string;
  units?: { name: string; code: string } | null;
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

const statusTone: Record<string, string> = {
  ativo: "bg-success/10 text-success border-success/20",
  ferias: "bg-warning/10 text-warning border-warning/20",
  afastado: "bg-destructive/10 text-destructive border-destructive/20",
  desligado: "bg-muted text-muted-foreground border-border",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function MinhaEquipe({ setorOnly = false }: { setorOnly?: boolean }) {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { isGerente, isAdmin, isSupervisor, isEncarregado } = useRole();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cargo: "", telefone: "", sector: "geral", role: "colaborador" });
  const canEdit = isGerente || isAdmin || isSupervisor;

  useEffect(() => {
    fetchMembers();
  }, [setorOnly]);

  async function fetchMembers() {
    const db = supabase as any;
    let query = db.from("team_members").select("*, units(name, code)").order("role").order("cargo");
    if (setorOnly && profile?.setor) query = query.eq("sector", profile.setor === "frente_de_caixa" ? "frente_caixa" : profile.setor);
    const { data, error } = await query;
    if (error) {
      toast({ title: "Não foi possível carregar a equipe", description: error.message, variant: "destructive" });
      return;
    }
    setMembers(data || []);
  }

  const visible = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = `${member.cargo} ${member.telefone || ""} ${sectorLabels[member.sector] || member.sector}`.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "todos" || member.role === filter || member.sector === filter;
      return matchesSearch && matchesFilter;
    });
  }, [members, filter, search]);

  async function addMember() {
    if (!profile?.unit_id) return;
    const db = supabase as any;
    const { error } = await db.from("team_members").insert({ unit_id: profile.unit_id, cargo: form.cargo || "Colaborador", telefone: form.telefone || null, sector: form.sector, role: form.role });
    if (error) {
      toast({ title: "Erro ao adicionar membro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Membro adicionado" });
    setOpen(false);
    setForm({ cargo: "", telefone: "", sector: "geral", role: "colaborador" });
    fetchMembers();
  }

  async function marcarPresenca(member: TeamMember, status: "presente" | "falta") {
    const db = supabase as any;
    const { error } = await db.from("attendance_records").insert({ team_member_id: member.id, marked_by: user?.id, status });
    if (error) toast({ title: "Erro ao registrar presença", description: error.message, variant: "destructive" });
    else toast({ title: status === "presente" ? "Presença marcada" : "Falta marcada" });
  }

  async function assumirChecklist() {
    if (!profile?.unit_id) return;
    const current = members.find((m) => m.user_id === user?.id);
    if (!current) return;
    const db = supabase as any;
    const { error } = await db.from("manager_substitutions").insert({ unit_id: profile.unit_id, substitute_member_id: current.id });
    if (error) toast({ title: "Não foi possível assumir", description: error.message, variant: "destructive" });
    else toast({ title: "Checklist assumido temporariamente" });
  }

  const unitName = members[0]?.units?.name || profile?.unidade || "Minha unidade";

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">{setorOnly ? "Meu Setor" : "Minha Equipe"}</p>
            <h1 className="text-2xl font-bold text-foreground">{unitName}</h1>
            <p className="text-sm text-muted-foreground">{visible.length} membros visíveis</p>
          </div>
          {canEdit && !setorOnly && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="h-12 w-12"><Plus className="h-5 w-5" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Adicionar membro</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Cargo/Nome</Label><Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Ana - Operadora de Caixa" /></div>
                  <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="559999999999" /></div>
                  <div><Label>Função</Label><Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="colaborador">Colaborador</SelectItem><SelectItem value="encarregado">Encarregado</SelectItem><SelectItem value="gerente">Gerente</SelectItem></SelectContent></Select></div>
                  <div><Label>Setor</Label><Select value={form.sector} onValueChange={(sector) => setForm({ ...form, sector })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(sectorLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                  <Button className="min-h-12 w-full" onClick={addMember}>Salvar membro</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {setorOnly && isEncarregado && (
          <Button variant="outline" className="mt-4 min-h-12 w-full" onClick={assumirChecklist}>Assumir checklist do gerente hoje</Button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["todos", "encarregado", "colaborador", ...Object.keys(sectorLabels)].map((item) => (
          <Button key={item} variant={filter === item ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => setFilter(item)}>
            {item === "todos" ? "Todos" : sectorLabels[item] || item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input className="min-h-12 pl-10" placeholder="Buscar por cargo, telefone ou setor" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {visible.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {member.foto_url ? <img src={member.foto_url} alt="" className="h-full w-full rounded-full object-cover" /> : initials(member.cargo)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">{member.cargo}</h2>
                    <Badge variant="outline" className={statusTone[member.status]}>{member.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.role} • {sectorLabels[member.sector]}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ClipboardCheck className="h-4 w-4 text-primary" /> Semana: 0%</span>
                    {member.telefone && <a className="flex items-center gap-1 text-primary" href={`https://wa.me/${member.telefone}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {setorOnly && <><Button variant="outline" className="min-h-11 flex-1" onClick={() => marcarPresenca(member, "presente")}><UserCheck className="mr-2 h-4 w-4" /> Presença</Button><Button variant="outline" className="min-h-11 flex-1" onClick={() => marcarPresenca(member, "falta")}><AlertTriangle className="mr-2 h-4 w-4" /> Falta</Button></>}
                <Button className="min-h-11 flex-1" onClick={() => navigate(`/equipe/${member.id}`)}>Ver detalhe</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {visible.length === 0 && <Card><CardContent className="flex min-h-32 items-center justify-center text-center text-muted-foreground"><Users className="mr-2 h-5 w-5" /> Nenhum membro encontrado.</CardContent></Card>}
      </div>
    </div>
  );
}
