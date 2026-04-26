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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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

function MenuSection({ label, items, collapsed }: { label: string; items: MenuItem[]; collapsed: boolean }) {
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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, profile } = useAuth();
  const { isAdmin, isSupervisor, isGerente, isEncarregado, isColaborador, isGerenteAdm } = useRole();
  const isCentralAdm = !isAdmin && isGerenteAdm;

  const principal: MenuItem[] = [
    { title: "Início", url: "/", icon: Home },
    { title: "Meu Perfil", url: "/meu-perfil", icon: UserCircle },
    { title: "Curiózinho", url: "/assistente", icon: MessageSquare },
  ];

  const comunicacao: MenuItem[] = [
    { title: "Avisos", url: "/avisos", icon: Bell },
    { title: "Notícias", url: "/noticias", icon: Megaphone },
    { title: "Mural de Reconhecimentos", url: "/reconhecimentos", icon: Trophy },
    { title: "Galeria do Curió", url: "/galeria", icon: Camera },
    { title: "Campanhas Internas", url: "/endomarketing", icon: Heart },
  ];

  const operacao: MenuItem[] = isCentralAdm
    ? []
    : [
        { title: "Meu Checklist do Dia", url: "/checklist-diario", icon: ClipboardCheck },
        ...(isColaborador ? [] : [{ title: isEncarregado && !isGerente ? "Meu Setor" : isSupervisor ? "Minhas Unidades" : "Minha Equipe", url: isSupervisor ? "/minhas-unidades" : isEncarregado && !isGerente ? "/meu-setor" : "/minha-equipe", icon: Users }]),
        { title: "Escala da Semana", url: "/escala-semana", icon: CalendarCheck },
        ...(isColaborador ? [] : [{ title: "B.O.s e Ocorrências", url: "/bo-eletronico", icon: FileQuestion }]),
        { title: "Reuniões da Unidade", url: "/reunioes-lideranca", icon: Video },
        ...(isGerente || isSupervisor || isAdmin ? [{ title: "Documentos", url: "/documentos-lideranca", icon: ScrollText }] : []),
        { title: "Tarefas", url: "/agenda", icon: CheckSquare },
      ];

  const gestao: MenuItem[] = [
    ...(isSupervisor || isAdmin ? [{ title: "Painel de Cobrança", url: "/painel-cobranca", icon: Gauge }] : []),
    ...(isGerente || isSupervisor || isAdmin ? [{ title: "Inspeções", url: "/inspecoes", icon: SearchCheck }] : []),
    ...(isGerente ? [{ title: "Avaliações de Encarregado", url: "/avaliacoes", icon: Star }, { title: "Aprovação de Solicitações", url: "/solicitacoes", icon: FileQuestion }, { title: "Relatórios da Unidade", url: "/relatorios", icon: Gauge }] : []),
  ];

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

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-3 p-4">
        <img src="/curio_logo_escuro.png" alt="Curió" className="h-10 w-auto shrink-0 object-contain" />
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-sidebar-foreground">Curió Conecta</h2>
            <p className="truncate text-[11px] text-sidebar-foreground/50">{isAdmin || isSupervisor ? "Todas as unidades" : profile?.unidade || "Carregando..."}</p>
          </div>
        )}
      </div>

      {!collapsed && profile && (
        <div className="mx-4 mb-3 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{profile.nome}</p>
          <p className="truncate text-xs text-sidebar-foreground/60">{profile.cargo_titulo || profile.cargo} • {isAdmin || isSupervisor ? "Todas as unidades" : profile.unidade}</p>
        </div>
      )}

      {!collapsed && <Separator className="mx-4 w-auto opacity-30" />}

      <SidebarContent className="mt-1 px-2">
        <MenuSection label="Principal" items={principal} collapsed={collapsed} />
        <MenuSection label="Comunicação" items={comunicacao} collapsed={collapsed} />
        <MenuSection label="Operação" items={operacao} collapsed={collapsed} />
        <MenuSection label="Gestão" items={gestao} collapsed={collapsed} />
        <MenuSection label="Central ADM" items={centralAdm} collapsed={collapsed} />
        <MenuSection label="Super Admin" items={superAdmin} collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={signOut}>
          <LogOut className="h-5 w-5" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}