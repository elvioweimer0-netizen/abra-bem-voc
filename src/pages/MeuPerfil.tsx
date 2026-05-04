import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Award, Camera, CheckCircle2, ClipboardCheck, Heart, Mail, MapPin, Medal, MessageCircle, Pencil, Star, Trophy, Upload, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationSettings } from "@/components/NotificationSettings";
import { AppearanceSettings } from "@/components/AppearanceSettings";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { AchievementsBadgeRow } from "@/components/achievements/AchievementsBadgeRow";
import { MilestoneBanner } from "@/components/milestones/MilestoneBanner";
import { MentorshipOffersEditor } from "@/components/mentorship/MentorshipOffersEditor";
import { CoverageAvailabilityEditor } from "@/components/coverage/CoverageAvailabilityEditor";

type Unit = { id: string; code: string; name: string };
type TeamMember = { id: string; unit_id: string; sector: string; role: string; cargo: string; nome?: string | null; telefone?: string | null; data_admissao?: string | null; foto_url?: string | null };
type Evaluation = { nota_geral: number; observacoes: string | null; mes: string; criado_em: string };
type Praise = { id: string; motivo: string; categoria: string; criado_em: string; praise_type?: string | null };

const sectorLabels: Record<string, string> = { acougue: "Açougue", padaria: "Padaria", hortifruti: "Hortifruti", mercearia: "Mercearia", frente_caixa: "Frente de Caixa", deposito: "Depósito", geral: "Geral" };
const cargoLabels: Record<string, string> = { admin: "Admin", master: "Master", supervisor: "Supervisor", gerente: "Gerente", gerente_loja: "Gerente Loja", gerente_adm: "Gerente Adm.", encarregado: "Encarregado", fiscal: "Fiscal", lider_setor: "Líder de Setor", colaborador: "Colaborador" };

function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase(); }
function onlyDigits(value?: string | null) { return (value || "").replace(/\D/g, ""); }
function whatsappUrl(phone: string) { const digits = onlyDigits(phone); return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`; }
function tenure(value?: string | null) {
  if (!value) return "Data de admissão não informada";
  const start = new Date(value); const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  const years = Math.max(0, Math.floor(months / 12)); const rest = Math.max(0, months % 12);
  if (!years && !rest) return "Menos de 1 mês na família Curió";
  return `${years ? `${years} ano${years > 1 ? "s" : ""}` : ""}${years && rest ? " e " : ""}${rest ? `${rest} mês${rest > 1 ? "es" : ""}` : ""} na família Curió`;
}

export default function MeuPerfil() {
  const { profile, user } = useAuth();
  const { cargo, isAdmin, isSupervisor, isGerente, isEncarregado } = useRole();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [receivedPraises, setReceivedPraises] = useState<Praise[]>([]);
  const [givenPraises, setGivenPraises] = useState(0);
  const [showPhotoBanner, setShowPhotoBanner] = useState(false);

  const profileAny = profile as any;
  const displayName = profile?.nome || "Usuário";
  const displayCargo = profileAny?.cargo_titulo || member?.cargo || cargoLabels[cargo] || cargo;
  const avatarUrl = profileAny?.foto_url || member?.foto_url;
  const phone = profileAny?.telefone || member?.telefone;
  const admissionDate = profileAny?.data_admissao || member?.data_admissao;
  const displayUnit = isAdmin || isSupervisor || !profile?.unit_id ? "Todas as unidades" : profile?.unidade;
  const sector = member?.sector || profile?.setor;

  useEffect(() => { load(); }, [profile?.user_id]);
  useEffect(() => {
    const dismissed = Number(localStorage.getItem("profile-photo-banner-dismissed") || 0);
    setShowPhotoBanner(!avatarUrl && Date.now() - dismissed > 7 * 24 * 60 * 60 * 1000);
  }, [avatarUrl]);

  async function load() {
    if (!profile?.user_id) return;
    const db = supabase as any;
    const [{ data: unitData }, { data: memberData }, { count }, { data: evalData }, { data: praisesData }, { count: givenCount }] = await Promise.all([
      db.from("units").select("id,code,name").eq("active", true).order("code"),
      db.from("team_members").select("id,unit_id,sector,role,cargo,nome,telefone,data_admissao,foto_url").eq("user_id", profile.user_id).maybeSingle(),
      profile.unit_id ? db.from("team_members").select("id", { count: "exact", head: true }).eq("unit_id", profile.unit_id) : Promise.resolve({ count: 0 }),
      db.from("encarregado_evaluations").select("nota_geral,observacoes,mes,criado_em").order("criado_em", { ascending: false }).limit(8),
      db.from("praises").select("id,motivo,categoria,criado_em,praise_type").order("criado_em", { ascending: false }).limit(20),
      db.from("praises").select("id", { count: "exact", head: true }).eq("autor_id", profile.user_id),
    ]);
    setUnits(unitData || []); setMember(memberData || null); setTeamCount(count || 0); setEvaluations(evalData || []); setReceivedPraises(praisesData || []); setGivenPraises(givenCount || 0);
  }

  async function uploadPhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/profile-${Date.now()}.${file.name.split(".").pop() || "jpg"}`;
    const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Não foi possível enviar a foto", description: error.message, variant: "destructive" }); return; }
    const { data } = await supabase.storage.from("profile-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
    const signedUrl = data?.signedUrl;
    if (signedUrl) await (supabase as any).from("profiles").update({ foto_url: signedUrl }).eq("user_id", user.id);
    toast({ title: "Foto atualizada" }); setShowPhotoBanner(false);
  }

  const stats = useMemo(() => {
    if (isAdmin) return [{ label: "Cumprimento rede", value: "87%" }, { label: "Ocorrências abertas", value: 12 }, { label: "Ranking", value: "Top 3" }, { label: "Unidades", value: units.length }];
    if (isSupervisor) return [{ label: "Inspeções no mês", value: 18 }, { label: "Cobranças", value: 24 }, { label: "Ocorrências acompanhadas", value: 9 }, { label: "Reuniões", value: 16 }];
    if (isGerente) return [{ label: "Checklist 30 dias", value: "91%" }, { label: "Ocorrências registradas", value: 7 }, { label: "Reuniões mês", value: 12 }, { label: "Elogios", value: `${givenPraises}/${receivedPraises.length}` }];
    if (isEncarregado) return [{ label: "Cumprimento", value: "89%" }, { label: "Avaliação média", value: evaluations[0]?.nota_geral?.toFixed(1) || "—" }, { label: "Elogios", value: receivedPraises.length }, { label: "Resposta Ocorrência", value: "2h" }];
    return [{ label: "Elogios recebidos", value: receivedPraises.length }, { label: "Tempo de casa", value: tenure(admissionDate).split(" na ")[0] }, { label: "Setor", value: sectorLabels[sector || "geral"] || "Geral" }, { label: "Status", value: "Ativo" }];
  }, [isAdmin, isSupervisor, isGerente, isEncarregado, units.length, givenPraises, receivedPraises.length, evaluations, admissionDate, sector]);

  return <div className="space-y-4 pb-20">
    <MilestoneBanner />
    {showPhotoBanner && <Card className="border-primary/20 bg-primary/10"><CardContent className="flex items-center justify-between gap-3 p-3"><p className="text-sm font-medium text-foreground">📸 Adicione uma foto sua para personalizar seu perfil</p><div className="flex gap-2"><Button size="sm" onClick={() => fileRef.current?.click()}>Adicionar agora</Button><Button size="sm" variant="ghost" onClick={() => { localStorage.setItem("profile-photo-banner-dismissed", String(Date.now())); setShowPhotoBanner(false); }}>Mais tarde</Button></div></CardContent></Card>}
    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files)} />

    <Card className="overflow-hidden border-0 gradient-curio text-primary-foreground shadow-sm">
      <CardContent className="relative flex flex-col items-center p-6 text-center">
        <Button size="icon" variant="secondary" className="absolute right-3 top-3 h-10 w-10 rounded-full bg-card/95 text-primary" onClick={() => fileRef.current?.click()} aria-label="Editar perfil"><Pencil className="h-4 w-4" /></Button>
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-primary-foreground bg-primary-foreground/15 text-3xl font-bold">
          {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : initials(displayName)}
        </div>
        <h1 className="mt-4 text-2xl font-bold">{displayName}</h1>
        <p className="text-base opacity-90">{displayCargo}</p>
        <p className="mt-1 flex items-center gap-1 text-sm opacity-85"><MapPin className="h-4 w-4" /> {displayUnit}</p>
      </CardContent>
    </Card>

    <InfoCard title="Dados pessoais" icon={<User className="h-5 w-5" />} rows={[
      ["Nome", displayName], ["Cargo", displayCargo], ["Telefone", phone ? <a className="text-primary" href={whatsappUrl(phone)} target="_blank" rel="noreferrer">{phone}</a> : "Não informado"], ["Email", profile?.email || "Não informado"], ["Admissão", admissionDate ? new Date(admissionDate).toLocaleDateString("pt-BR") : "Não informada"], ["Tempo de Curió", tenure(admissionDate)],
    ]} />

    <InfoCard title="Atuação" icon={<MapPin className="h-5 w-5" />} rows={[
      ["Unidade(s)", isAdmin || isSupervisor ? units.map((u) => u.code).join(" • ") || "Todas" : displayUnit], ["Setor", sector ? sectorLabels[String(sector).replace("frente_de_caixa", "frente_caixa")] || sector : "Geral"], ["Reporta a", isAdmin ? "Diretoria" : isSupervisor ? "Elvio Weimer" : isGerente ? "Roberto" : "Gerente da unidade"], ["Equipe", isGerente ? `${teamCount} pessoas na unidade` : isEncarregado ? `${teamCount} pessoas no setor` : "Colaborador"],
    ]} />

    <Card><CardContent className="p-4"><h2 className="mb-3 flex items-center gap-2 font-bold text-foreground"><ClipboardCheck className="h-5 w-5 text-primary" /> Estatísticas pessoais</h2><div className="grid grid-cols-2 gap-2">{stats.map((item) => <div key={item.label} className="rounded-lg bg-muted p-3"><p className="text-lg font-bold text-foreground">{item.value}</p><p className="text-xs text-muted-foreground">{item.label}</p></div>)}</div></CardContent></Card>

    {isEncarregado && <Card><CardContent className="p-4"><h2 className="font-bold text-foreground">Suas avaliações</h2><div className="mt-3 space-y-2">{evaluations.slice(0, 3).map((e) => <div key={`${e.mes}-${e.criado_em}`} className="rounded-lg border p-3"><p className="font-semibold text-foreground">⭐ {Number(e.nota_geral).toFixed(1)} • {e.mes}</p>{e.observacoes && <p className="text-sm text-muted-foreground">{e.observacoes}</p>}</div>)}{evaluations.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada ainda.</p>}</div><Button className="mt-3 w-full" variant="outline">Solicitar feedback ao gerente</Button></CardContent></Card>}

    <Card><CardContent className="p-4"><div className="flex items-center justify-between mb-3"><h2 className="flex items-center gap-2 font-bold text-foreground"><Medal className="h-5 w-5 text-[hsl(var(--gold))]" /> Conquistas</h2><Link to="/perfil/conquistas" className="text-xs text-primary font-semibold">Ver todas →</Link></div><AchievementsBadgeRow /></CardContent></Card>

    <Card><CardContent className="p-4"><h2 className="mb-3 flex items-center gap-2 font-bold text-foreground"><Heart className="h-5 w-5 text-primary" /> Elogios recebidos</h2>
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-primary/10 p-2"><p className="text-lg font-bold text-primary">{receivedPraises.filter((p) => (p.praise_type || "liderado") === "liderado").length}</p><p className="text-[11px] text-muted-foreground">👑 Liderado</p></div>
        <div className="rounded-lg bg-[hsl(var(--gold)/0.15)] p-2"><p className="text-lg font-bold text-[hsl(var(--gold))]">{receivedPraises.filter((p) => p.praise_type === "peer").length}</p><p className="text-[11px] text-muted-foreground">🤝 Peer</p></div>
        <div className="rounded-lg bg-blue-500/10 p-2"><p className="text-lg font-bold text-blue-600 dark:text-blue-400">{receivedPraises.filter((p) => p.praise_type === "equipe_externa").length}</p><p className="text-[11px] text-muted-foreground">🌐 Externa</p></div>
      </div>
      <div className="space-y-2">{receivedPraises.slice(0, 3).map((p) => <div key={p.id} className="rounded-lg bg-muted p-3"><Badge variant="outline" className="mb-2">{p.categoria}</Badge><p className="text-sm text-foreground">{p.motivo}</p></div>)}{receivedPraises.length === 0 && <p className="text-sm text-muted-foreground">Nenhum elogio recebido ainda.</p>}</div></CardContent></Card>

    <Card><CardContent className="p-4"><Link to="/perfil/sincronizacao" className="flex items-center justify-between"><span className="font-semibold text-foreground">Sincronização offline</span><span className="text-xs text-primary">Ver fila →</span></Link></CardContent></Card>

    <MentorshipOffersEditor />
    <CoverageAvailabilityEditor />

    <AppearanceSettings />
    <NotificationSettings />
  </div>;
}

function InfoCard({ title, icon, rows }: { title: string; icon: ReactNode; rows: [string, ReactNode][] }) {
  return <Card><CardContent className="p-4"><h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">{icon} {title}</h2><div className="space-y-3">{rows.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 border-b border-border/70 pb-2 last:border-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className="max-w-[60%] text-right text-sm font-medium text-foreground">{value}</span></div>)}</div></CardContent></Card>;
}