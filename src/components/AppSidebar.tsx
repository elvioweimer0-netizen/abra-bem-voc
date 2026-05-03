import {
  Bell,
  Briefcase,
  Building,
  CalendarCheck,
  CalendarClock,
  Camera,
  CheckSquare,
  ClipboardCheck,
  FileQuestion,
  Gauge,
  HardDrive,
  Heart,
  Home,
  LogOut,
  Megaphone,
  MessageSquare,
  ScrollText,
  SearchCheck,
  Settings,
  ShoppingCart,
  Star,
  Trophy,
  UserCircle,
  UserCog,
  Users,
  Video,
  Wrench,
  Map,
  History,
  GraduationCap,
  HeartPulse,
  Sunrise,
  Target,
} from "lucide-react";
import { useClimateAccess } from "@/hooks/useClimateAccess";
import { useIsRhAdmin } from "@/hooks/useIsRhAdmin";
import { useCanEditCulture } from "@/hooks/useCanEditCulture";
import { Sparkles as SparklesIcon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import ConectaLockup from "@/components/ConectaLockup";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const cargoLabels: Record<string, string> = {
  master: "Master", admin: "Admin", supervisor: "Supervisor",
  gerente: "Gerente", gerente_loja: "Gerente Loja", gerente_adm: "Gerente Adm.",
  encarregado: "Encarregado", fiscal: "Fiscal", lider_setor: "Líder de Setor", colaborador: "Colaborador",
};

function UserBlock({ profile }: { profile: ReturnType<typeof useAuth>["profile"] }) {
  if (!profile) return null;
  const profileAny = profile as any;
  const initials = (profile.nome || "U").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const cargoLabel = profileAny?.cargo_titulo || cargoLabels[profile.cargo as string] || profile.cargo;
  return (
    <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl bg-sidebar-accent/40 p-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-primary/20 text-sm font-bold text-sidebar-primary-foreground">
        {profileAny?.foto_url ? (
          <img src={profileAny.foto_url} alt={profile.nome} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-sidebar-foreground">{profile.nome}</p>
        <p className="truncate text-xs text-sidebar-foreground/60">{cargoLabel} · {profile.unidade || "REDE"}</p>
      </div>
    </div>
  );
}

const centralAreas = [
  { title: "RH", url: "/central-adm/rh", icon: Users, owner: "Gleisiane" },
  { title: "DP", url: "/central-adm/dp", icon: Briefcase, owner: "Ygor" },
  { title: "Financeiro", url: "/central-adm/financeiro", icon: Gauge, owner: "Regiane" },
  { title: "TI", url: "/central-adm/ti", icon: HardDrive, owner: "Kildery" },
  { title: "Manutenção", url: "/central-adm/manutencao", icon: Wrench, owner: "Hilton" },
  { title: "Marketing", url: "/central-adm/marketing", icon: Megaphone, owner: "Marketing" },
  { title: "Comercial", url: "/central-adm/comercial", icon: ShoppingCart, owner: "Comercial" },
  { title: "Administrativo", url: "/central-adm/administrativo", icon: ScrollText, owner: "Administrativo" },
] satisfies Array<MenuItem & { owner: string }>;

function MenuSection({ label, items, collapsed, onNavigate }: { label: string; items: MenuItem[]; collapsed: boolean; onNavigate?: () => void }) {
  if (!items.length) return null;

  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] font-semibold tracking-widest">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={`${label}-${item.title}`}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function getCentralArea(profile: ReturnType<typeof useAuth>["profile"]): MenuItem[] {
  const text = `${profile?.nome ?? ""} ${profile?.cargo_titulo ?? ""} ${profile?.descricao ?? ""}`.toLowerCase();
  if (text.includes("gleisiane") || text.includes("rh")) return centralAreas.filter((a) => a.title === "RH");
  if (text.includes("ygor") || text.includes("departamento pessoal") || text.includes("dp")) return centralAreas.filter((a) => a.title === "DP");
  if (text.includes("regiane") || text.includes("financeiro")) return centralAreas.filter((a) => a.title === "Financeiro");
  if (text.includes("kildery") || text.includes("ti")) return centralAreas.filter((a) => a.title === "TI");
  if (text.includes("hilton") || text.includes("manutenção") || text.includes("manutencao")) return centralAreas.filter((a) => a.title === "Manutenção");
  return [];
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const menuCollapsed = isMobile ? false : collapsed;
  const { signOut, profile } = useAuth();
  const { cargo, isAdmin, isSupervisor, isGerente, isEncarregado, isColaborador, isGerenteAdm, isFeedUser, isLider } = useRole();
  const isCentralAdm = !isAdmin && isGerenteAdm;
  const isRhAdmin = useIsRhAdmin();
  const { canViewClima, canManageClima } = useClimateAccess();
  const canEditCulture = useCanEditCulture();

  const profileAny = profile as any;
  const myUnitId = profileAny?.unit_id as string | undefined;
  const unitHomeUrl = myUnitId ? `/unidade/${myUnitId}` : "/unidades";

  const closeOnNav = () => isMobile && setOpenMobile(false);

  // ───── Feed users: menu mínimo ─────
  if (isFeedUser) {
    const feedPrincipal: MenuItem[] = [
      { title: "Início", url: "/", icon: Home },
      { title: "Meu Perfil", url: "/meu-perfil", icon: UserCircle },
      { title: "Curiózinho", url: "/assistente", icon: MessageSquare },
      { title: "Minha Unidade", url: unitHomeUrl, icon: Building },
    ];
    const feedComunicacao: MenuItem[] = [
      { title: "Avisos", url: "/avisos", icon: Bell },
      { title: "Notícias", url: "/noticias", icon: Megaphone },
      { title: "Cultura Curió", url: "/cultura", icon: SparklesIcon },
      { title: "Curió de Ouro", url: "/curio-de-ouro", icon: Trophy },
      { title: "Galeria do Curió", url: "/galeria", icon: Camera },
      { title: "Treinamento", url: "/treinamento", icon: GraduationCap },
      { title: "Documentos", url: "/rh/cartilha", icon: ScrollText },
      { title: "Falar com RH", url: "/central-adm/rh", icon: Users },
    ];
    return (
      <Sidebar collapsible="offcanvas" className="border-r-0">
        <div className="flex items-center justify-center p-8">
          {menuCollapsed ? (
            <img src="/logos/curio_logo_vermelho.png" alt="Curió" className="h-10 w-auto object-contain" />
          ) : (
            <ConectaLockup variant="brown" size="md" />
          )}
        </div>
        {!menuCollapsed && <Separator className="mx-4 w-auto opacity-30" />}
        {!menuCollapsed && <UserBlock profile={profile} />}
        <SidebarContent className="mt-1 px-2">
          <MenuSection label="Principal" items={feedPrincipal} collapsed={menuCollapsed} onNavigate={closeOnNav} />
          <MenuSection label="Comunicação" items={feedComunicacao} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        </SidebarContent>
        <SidebarFooter className="p-2">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={signOut}>
            <LogOut className="h-5 w-5" />
            {!menuCollapsed && "Sair"}
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  // ───── Líderes: menu completo (comportamento original) ─────
  const principal: MenuItem[] = [
    { title: "Início", url: "/", icon: Home },
    { title: "Meu Perfil", url: "/meu-perfil", icon: UserCircle },
    { title: "Curiózinho", url: "/assistente", icon: MessageSquare },
  ];

  const comunicacao: MenuItem[] = [
    { title: "Avisos", url: "/avisos", icon: Bell },
    { title: "Notícias", url: "/noticias", icon: Megaphone },
    { title: "Cultura Curió", url: "/cultura", icon: SparklesIcon },
    { title: "Curió de Ouro", url: "/curio-de-ouro", icon: Trophy },
    { title: "Mural de Reconhecimentos", url: "/reconhecimentos", icon: Trophy },
    { title: "Galeria do Curió", url: "/galeria", icon: Camera },
    { title: "Treinamento", url: "/treinamento", icon: GraduationCap },
    { title: "Campanhas Internas", url: "/endomarketing", icon: Heart },
  ];

  const operacao: MenuItem[] = isCentralAdm
    ? []
    : [
        { title: "Meu Checklist do Dia", url: "/checklist-diario", icon: ClipboardCheck },
        ...(isColaborador ? [] : [{ title: isEncarregado && !isGerente ? "Meu Setor" : isSupervisor ? "Minhas Unidades" : "Minha Equipe", url: isSupervisor ? "/minhas-unidades" : isEncarregado && !isGerente ? "/meu-setor" : "/minha-equipe", icon: Users }]),
        { title: "Escala da Semana", url: "/escala-semana", icon: CalendarCheck },
        ...(isColaborador ? [] : [{ title: "Ocorrências", url: "/ocorrencias", icon: FileQuestion }]),
        { title: "Reuniões da Unidade", url: "/reunioes-lideranca", icon: Video },
        ...(isGerente || isSupervisor || isAdmin ? [{ title: "Documentos", url: "/documentos-lideranca", icon: ScrollText }] : []),
        { title: "Tarefas", url: "/agenda", icon: CheckSquare },
        { title: isAdmin || isSupervisor ? "Unidades" : "Minha Unidade", url: isAdmin || isSupervisor ? "/unidades" : unitHomeUrl, icon: Building },
      ];

  const gestao: MenuItem[] = [
    ...(isSupervisor || isAdmin ? [{ title: "Painel de Cobrança", url: "/painel-cobranca", icon: Gauge }] : []),
    ...(isGerente || isSupervisor || isAdmin ? [{ title: "Inspeções", url: "/inspecoes", icon: SearchCheck }] : []),
    ...(isGerente ? [{ title: "Avaliações de Encarregado", url: "/avaliacoes", icon: Star }, { title: "Aprovação de Solicitações", url: "/solicitacoes", icon: FileQuestion }, { title: "Relatórios da Unidade", url: "/relatorios", icon: Gauge }] : []),
  ];

  const visitas: MenuItem[] = (isAdmin || isSupervisor)
    ? [
        { title: "Mapa de Visitas", url: "/mapa-visitas", icon: Map },
        { title: "Histórico de Visitas", url: "/historico-visitas", icon: History },
      ]
    : [];

  const centralAdm = isAdmin ? centralAreas : getCentralArea(profile);

  const superAdmin: MenuItem[] = isAdmin
    ? [
        { title: "Visão Geral", url: "/visao-geral-admin", icon: Gauge },
        { title: "Gestão de Usuários", url: "/gestao-usuarios", icon: UserCog },
        { title: "Gestão de Unidades", url: "/departamentos", icon: Building },
        { title: "Configurações do App", url: "/gestao-usuarios", icon: Settings },
        { title: "Logs do Sistema", url: "/relatorios", icon: ScrollText },
      ]
    : [];

  const adminTreinamento: MenuItem[] = [
    ...(isRhAdmin ? [{ title: "Treinamento", url: "/admin/treinamento", icon: GraduationCap }] : []),
    ...(canManageClima ? [{ title: "Clima", url: "/admin/clima", icon: HeartPulse }] : []),
    ...(canEditCulture ? [{ title: "Cultura", url: "/admin/cultura", icon: SparklesIcon }] : []),
    ...(isAdmin ? [{ title: "Conquistas", url: "/admin/conquistas", icon: Trophy }] : []),
  ];

  const climaItems: MenuItem[] = canViewClima
    ? [{ title: "Clima", url: "/clima", icon: HeartPulse }]
    : [];

  const dailyItems: MenuItem[] = [
    ...(isLider ? [{ title: "Daily Huddle", url: "/daily-huddle", icon: Sunrise }] : []),
    ...(isAdmin || isSupervisor ? [{ title: "Painel Daily", url: "/daily-huddle/painel", icon: Gauge }] : []),
  ];

  const compromissoItems: MenuItem[] = [
    ...(isLider ? [{ title: "Compromissos", url: "/compromissos", icon: Target }] : []),
    ...(isAdmin || isSupervisor ? [{ title: "Quadro", url: "/compromissos/board", icon: ClipboardCheck }] : []),
  ];

  const conquistasItems: MenuItem[] = [
    { title: "Minhas Conquistas", url: "/perfil/conquistas", icon: Trophy },
    ...(isLider ? [{ title: "Ranking", url: "/conquistas/ranking", icon: Star }] : []),
  ];

  const cadernoItems: MenuItem[] = isLider
    ? [
        { title: "Caderno", url: "/caderno", icon: ScrollText },
        ...(isRhAdmin ? [{ title: "Admin · Caderno", url: "/admin/caderno", icon: ScrollText }] : []),
      ]
    : [];

  const perguntaSemanaItems: MenuItem[] = (isAdmin || isSupervisor || cargo === "gerente_loja" || cargo === "gerente_adm" || cargo === "master")
    ? [
        { title: "Pergunta da Semana", url: "/pergunta-semana", icon: MessageSquare },
        ...(isAdmin || isSupervisor ? [{ title: "Admin · Perguntas", url: "/admin/pergunta-semana", icon: MessageSquare }] : []),
      ]
    : [];

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <div className="flex items-center justify-center p-8">
        {menuCollapsed ? (
          <img src="/logos/curio_logo_vermelho.png" alt="Curió" className="h-10 w-auto object-contain" />
        ) : (
          <ConectaLockup variant="brown" size="md" />
        )}
      </div>

      {!menuCollapsed && <Separator className="mx-4 w-auto opacity-30" />}
      {!menuCollapsed && <UserBlock profile={profile} />}

      <SidebarContent className="mt-1 px-2">
        <MenuSection label="Principal" items={principal} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Comunicação" items={comunicacao} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Operação" items={operacao} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Visitas" items={visitas} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Gestão" items={gestao} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Clima" items={climaItems} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Daily" items={dailyItems} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Compromissos" items={compromissoItems} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Conquistas" items={conquistasItems} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Caderno" items={cadernoItems} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Pergunta da Semana" items={perguntaSemanaItems} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Central ADM" items={centralAdm} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Super Admin" items={superAdmin} collapsed={menuCollapsed} onNavigate={closeOnNav} />
        <MenuSection label="Admin · RH" items={adminTreinamento} collapsed={menuCollapsed} onNavigate={closeOnNav} />
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={signOut}>
          <LogOut className="h-5 w-5" />
          {!menuCollapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}