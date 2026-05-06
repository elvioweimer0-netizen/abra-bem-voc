import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, ChevronRight, ClipboardCheck, HeartPulse, MessageCircle, Palmtree, Plus, Search, Upload, UserCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const sectorLabels: Record<string, string> = {
  acougue: "Açougue",
  padaria: "Padaria",
  hortifruti: "Hortifruti",
  mercearia: "Mercearia",
  frente_caixa: "Frente de Caixa",
  deposito: "Depósito",
  geral: "Geral",
};

const sectorVars: Record<string, string> = {
  acougue: "--sector-acougue",
  padaria: "--sector-padaria",
  hortifruti: "--sector-hortifruti",
  mercearia: "--sector-mercearia",
  frente_caixa: "--sector-frente-caixa",
  deposito: "--sector-deposito",
  geral: "--sector-geral",
};

const roleLabels: Record<string, string> = {
  gerente: "Gerente",
  encarregado: "Encarregado",
  colaborador: "Colaborador",
};

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  ferias: "Férias",
  afastado: "Afastado",
  desligado: "Desligado",
};

type TeamMember = {
  id: string;
  user_id: string | null;
  unit_id: string;
  sector: string;
  role: string;
  cargo: string;
  nome?: string | null;
  idade?: number | null;
  foto_url: string | null;
  telefone: string | null;
  data_admissao: string | null;
  status: string;
  units?: { name: string; code: string } | null;
};

type Unit = { id: string; code: string; name: string };

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function whatsappUrl(phone: string) {
  const digits = onlyDigits(phone);
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

export default function MinhaEquipe({ setorOnly = false }: { setorOnly?: boolean }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, user } = useAuth();
  const { isGerente, isAdmin, isSupervisor, isEncarregado } = useRole();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState(searchParams.get("unit") || profile?.unit_id || "");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [sectorFilter, setSectorFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", cargo: "", telefone: "", sector: "geral", role: "colaborador", data_admissao: "", status: "ativo", foto_url: "" });
  const canEdit = isGerente || isAdmin || isSupervisor;
  const canSelectUnit = isAdmin || isSupervisor;

  useEffect(() => {
    const loadUnits = async () => {
      const db = supabase as any;
      const { data } = await db.from("units").select("id, code, name").eq("active", true).order("code");
      const activeUnits = (data || []) as Unit[];
      setUnits(activeUnits);
      if (canSelectUnit && !selectedUnitId) {
        setSelectedUnitId(activeUnits.find((unit) => unit.code === "L01")?.id || activeUnits[0]?.id || "");
      }
    };
    loadUnits();
  }, [canSelectUnit, selectedUnitId]);

  useEffect(() => {
    if (!canSelectUnit && profile?.unit_id) setSelectedUnitId(profile.unit_id);
  }, [canSelectUnit, profile?.unit_id]);

  useEffect(() => {
    fetchMembers();
  }, [setorOnly, selectedUnitId]);

  async function fetchMembers() {
    const db = supabase as any;
    const sectorMap = (s?: string | null) => {
      if (!s) return "geral";
      const k = s.toLowerCase();
      if (k === "frente_de_caixa") return "frente_caixa";
      return k;
    };
    let query = db
      .from("profiles")
      .select("id, user_id, unit_id, nome, cargo, cargo_titulo, setor, foto_url, telefone, data_admissao, afastado_status, is_general_manager, units:unit_id(name, code)")
      .eq("ativo", true)
      .order("nome");
    if (selectedUnitId) query = query.eq("unit_id", selectedUnitId);
    if ((setorOnly || (isEncarregado && !isGerente && !canSelectUnit)) && profile?.setor) {
      query = query.eq("setor", profile.setor as any);
    }
    const { data, error } = await query;
    if (error) {
      toast({ title: "Não foi possível carregar a equipe", description: error.message, variant: "destructive" });
      return;
    }
    const mapped = (data || []).map((p: any) => {
      const cargoLower = (p.cargo_titulo || p.cargo || "").toLowerCase();
      const role = p.is_general_manager || cargoLower.includes("gerente")
        ? "gerente"
        : cargoLower.includes("encarregado") || cargoLower.includes("lider") || cargoLower.includes("líder")
          ? "encarregado"
          : "colaborador";
      const status = !p.afastado_status ? "ativo" : p.afastado_status === "ferias" ? "ferias" : "afastado";
      return {
        id: p.id,
        user_id: p.user_id,
        unit_id: p.unit_id,
        sector: sectorMap(p.setor),
        role,
        cargo: p.cargo_titulo || p.cargo || "Colaborador",
        nome: p.nome,
        foto_url: p.foto_url,
        telefone: p.telefone,
        data_admissao: p.data_admissao ?? null,
        status,
        units: p.units,
      } as TeamMember;
    });
    setMembers(mapped);
  }

  const visible = useMemo(() => {
    return members.filter((member) => {
      const displayName = member.nome || member.cargo;
      const haystack = `${displayName} ${member.cargo} ${member.telefone || ""} ${sectorLabels[member.sector] || member.sector}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesRole = roleFilter === "todos" || member.role === roleFilter;
      const matchesSector = sectorFilter === "todos" || member.sector === sectorFilter;
      return matchesSearch && matchesRole && matchesSector;
    });
  }, [members, roleFilter, sectorFilter, search]);

  const stats = useMemo(() => ({
    active: members.filter((m) => m.status === "ativo").length,
    vacation: members.filter((m) => m.status === "ferias").length,
    away: members.filter((m) => m.status === "afastado").length,
    compliance: members.length ? 0 : 0,
  }), [members]);

  async function addMember() {
    if (!selectedUnitId || !form.nome.trim()) {
      toast({ title: "Informe o nome completo", variant: "destructive" });
      return;
    }
    const db = supabase as any;
    const { error } = await db.from("team_members").insert({
      unit_id: selectedUnitId,
      nome: form.nome.trim(),
      cargo: form.cargo.trim() || form.nome.trim(),
      telefone: form.telefone ? `55${onlyDigits(form.telefone).replace(/^55/, "")}` : null,
      sector: form.sector,
      role: form.role,
      data_admissao: form.data_admissao || null,
      status: form.status,
      foto_url: form.foto_url || null,
    });
    if (error) {
      toast({ title: "Erro ao adicionar membro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Membro adicionado" });
    setOpen(false);
    setPreview(null);
    setForm({ nome: "", cargo: "", telefone: "", sector: "geral", role: "colaborador", data_admissao: "", status: "ativo", foto_url: "" });
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

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);
  const unitName = selectedUnit?.name || members[0]?.units?.name || profile?.unidade || "Minha unidade";
  const pageTitle = `${setorOnly ? "Meu Setor" : "Minha Equipe"} — ${unitName.replace(" - ", " ")}`;

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    setSearchParams({ unit: unitId });
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-primary">Operação de loja</p>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
        </div>
        {canSelectUnit && units.length > 0 && (
          <Select value={selectedUnitId} onValueChange={handleUnitChange}>
            <SelectTrigger className="min-h-12"><SelectValue placeholder="Selecionar unidade" /></SelectTrigger>
            <SelectContent>
              {units.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.name.replace(" - ", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat icon={<Users className="h-4 w-4" />} label="Total Ativos" value={stats.active} tone="bg-success/10 text-success" />
          <MiniStat icon={<Palmtree className="h-4 w-4" />} label="Em Férias" value={stats.vacation} tone="bg-warning/10 text-warning" />
          <MiniStat icon={<HeartPulse className="h-4 w-4" />} label="Afastados" value={stats.away} tone="bg-muted text-muted-foreground" />
          <MiniStat icon={<ClipboardCheck className="h-4 w-4" />} label="Semana" value={`${stats.compliance}%`} tone="bg-primary/10 text-primary" />
        </div>
        {setorOnly && isEncarregado && (
          <Button variant="outline" className="min-h-12 w-full" onClick={assumirChecklist}>Assumir checklist do gerente hoje</Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["todos", "Todos"],
            ["encarregado", "Encarregado"],
            ["colaborador", "Colaborador"],
          ].map(([value, label]) => (
            <Button key={value} variant={roleFilter === value ? "default" : "outline"} size="sm" onClick={() => setRoleFilter(value)}>{label}</Button>
          ))}
        </div>
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="min-h-11"><SelectValue placeholder="Setor: Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Setor: Todos</SelectItem>
            {Object.entries(sectorLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input className="min-h-12 pl-10" placeholder="Buscar por nome, cargo, telefone ou setor" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {visible.map((member) => {
          const displayName = member.nome || member.cargo;
          const sectorVar = sectorVars[member.sector] || sectorVars.geral;
          return (
            <Card key={member.id} className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold" style={{ backgroundColor: `hsl(var(${sectorVar}) / 0.16)`, color: `hsl(var(${sectorVar}))` }}>
                    {member.foto_url ? <img src={member.foto_url} alt={displayName} className="h-full w-full object-cover" /> : initials(displayName)}
                  </div>
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => navigate(`/equipe/${member.id}`)}>
                    <h2 className="truncate font-semibold text-foreground">{displayName}</h2>
                    <p className="truncate text-sm text-muted-foreground">{member.cargo}</p>
                    <Badge variant="outline" className="mt-1 border-transparent text-[11px]" style={{ backgroundColor: `hsl(var(${sectorVar}) / 0.12)`, color: `hsl(var(${sectorVar}))` }}>{sectorLabels[member.sector] || member.sector}</Badge>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${member.status === "ativo" ? "bg-success" : member.status === "ferias" ? "bg-warning" : "bg-muted-foreground"}`} title={statusLabels[member.status] || member.status} />
                    {member.telefone && <a className="flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success" href={whatsappUrl(member.telefone)} target="_blank" rel="noreferrer" aria-label={`WhatsApp de ${displayName}`}><MessageCircle className="h-5 w-5" /></a>}
                    <button className="flex h-11 w-8 items-center justify-center text-muted-foreground" onClick={() => navigate(`/equipe/${member.id}`)} aria-label="Ver detalhe"><ChevronRight className="h-5 w-5" /></button>
                  </div>
                </div>
                {setorOnly && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="min-h-11" onClick={() => marcarPresenca(member, "presente")}><UserCheck className="mr-2 h-4 w-4" /> Presença</Button>
                    <Button variant="outline" className="min-h-11" onClick={() => marcarPresenca(member, "falta")}><AlertTriangle className="mr-2 h-4 w-4" /> Falta</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {visible.length === 0 && <Card><CardContent className="flex min-h-32 items-center justify-center text-center text-muted-foreground"><Users className="mr-2 h-5 w-5" /> Nenhum membro encontrado.</CardContent></Card>}
      </div>

      {canEdit && !setorOnly && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 h-14 w-14 rounded-full p-0 shadow-lg md:bottom-6" aria-label="Adicionar membro"><Plus className="h-7 w-7" /></Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Adicionar membro</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  {preview ? <img src={preview} alt="Prévia" className="h-full w-full object-cover" /> : <Upload className="h-7 w-7" />}
                </div>
                <Input type="file" accept="image/*" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setPreview(URL.createObjectURL(file));
                }} />
              </div>
              <div><Label>Nome completo</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Ana Maria Silva" /></div>
              <div><Label>Cargo</Label><Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Operadora de Caixa" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Setor</Label><Select value={form.sector} onValueChange={(sector) => setForm({ ...form, sector })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(sectorLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Função</Label><Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gerente">Gerente</SelectItem><SelectItem value="encarregado">Encarregado</SelectItem><SelectItem value="colaborador">Colaborador</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })} placeholder="(65) 99999-9999" inputMode="tel" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Admissão</Label><Input type="date" value={form.data_admissao} onChange={(e) => setForm({ ...form, data_admissao: e.target.value })} /></div>
                <div><Label>Status</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="ferias">Férias</SelectItem><SelectItem value="afastado">Afastado</SelectItem><SelectItem value="desligado">Desligado</SelectItem></SelectContent></Select></div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={addMember}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone: string }) {
  return <div className={`rounded-full px-3 py-2 ${tone}`}><div className="flex items-center gap-2 text-xs font-semibold">{icon}<span>{label}: {value}</span></div></div>;
}
