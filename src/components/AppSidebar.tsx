import {
  LayoutDashboard, Users, AlertTriangle, Ban, Building, FileText, LogOut,
  Megaphone, Heart, Bell, Video, CalendarDays, Plus, History, Camera,
  BookOpen, ClipboardList, FileCheck, UserCog, ChevronDown,
  Monitor, Wrench, TrendingUp, ShoppingCart, DollarSign,
  Briefcase, HardDrive, Headphones, FileQuestion, UserCircle,
  Calendar, Clock, Receipt, FilePlus,
} from "lucide-react";
import { CuriozinhoAvatar } from "@/components/curiozinho";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/* ─── types ─── */

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

/* ─── reusable section ─── */

function MenuSection({ label, items, collapsed }: { label: string; items: MenuItem[]; collapsed: boolean }) {
  if (items.length === 0) return null;
  return (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-semibold">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
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

/* ─── collapsible section ─── */

function CollapsibleSection({ label, items, collapsed }: { label: string; items: MenuItem[]; collapsed: boolean }) {
  if (items.length === 0) return null;
  if (collapsed) {
    return <MenuSection label={label} items={items} collapsed />;
  }
  return (
    <SidebarGroup>
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-semibold">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            {label}
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

/* ─── menu definitions ─── */

const comunicacaoItems: MenuItem[] = [
  { title: "Notícias", url: "/noticias", icon: Megaphone },
  { title: "Campanhas Internas", url: "/endomarketing", icon: Heart },
  { title: "Avisos", url: "/avisos", icon: Bell },
  { title: "Galeria do Curió", url: "/galeria", icon: Camera },
];

const rhItems: MenuItem[] = [
  { title: "Colaboradores", url: "/colaboradores", icon: Users },
  { title: "Advertências", url: "/advertencias", icon: AlertTriangle },
  { title: "Suspensões", url: "/suspensoes", icon: Ban },
];

const rhDocsItems: MenuItem[] = [
  { title: "Código de Ética", url: "/rh/codigo-etica", icon: BookOpen },
  { title: "Cartilha Operacional", url: "/rh/cartilha", icon: ClipboardList },
  { title: "Políticas Internas", url: "/rh/politicas", icon: FileCheck },
];

const gerenciaItems: MenuItem[] = [
  { title: "Operação", url: "/gerencias/operacao", icon: Monitor },
  { title: "RH", url: "/gerencias/rh", icon: Users },
  { title: "DP", url: "/gerencias/dp", icon: Briefcase },
  { title: "Financeiro", url: "/gerencias/financeiro", icon: DollarSign },
  { title: "Marketing", url: "/gerencias/marketing", icon: TrendingUp },
  { title: "Manutenção", url: "/gerencias/manutencao", icon: Wrench },
  { title: "TI", url: "/gerencias/ti", icon: HardDrive },
  { title: "Administrativo", url: "/gerencias/administrativo", icon: Briefcase },
  { title: "Comercial", url: "/gerencias/comercial", icon: ShoppingCart },
];

const reunioesItems: MenuItem[] = [
  { title: "Entrar na Sala", url: "/reunioes", icon: Video },
  { title: "Criar Reunião", url: "/reunioes/criar", icon: Plus },
  { title: "Agenda", url: "/agenda", icon: CalendarDays },
  { title: "Histórico", url: "/reunioes/historico", icon: History },
];

const colaboradorItems: MenuItem[] = [
  { title: "Meus Dados", url: "/meu-perfil", icon: UserCircle },
  { title: "Calendário", url: "/calendario", icon: Calendar },
  { title: "Meu Ponto", url: "/ponto", icon: Clock },
  { title: "Holerite", url: "/holerite", icon: Receipt },
  { title: "Atestados", url: "/atestados", icon: FilePlus },
];

const solicitacoesItems: MenuItem[] = [
  { title: "Solicitações", url: "/solicitacoes", icon: FileQuestion },
  { title: "Chamados TI", url: "/chamados-ti", icon: Headphones },
  { title: "Manutenção", url: "/chamados-manutencao", icon: Wrench },
];

/* ─── component ─── */

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, profile } = useAuth();
  const {
    isAdmin, isSupervisor, isGerenteAdm, isGerenteLoja,
    isColaborador, isGestao, canManageUsers,
  } = useRole();

  const showGerencias = isAdmin || isSupervisor || isGerenteAdm;
  const showRh = isGestao;
  const showDocs = !isColaborador;
  const showRelatórios = isGestao;
  const showSolicitacoes = isGerenteLoja || isAdmin || isSupervisor;
  const showReunioesFull = !isColaborador;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <img
          src="/logo-curio.png"
          alt="Curió"
          className="h-10 w-10 object-contain shrink-0"
        />
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="font-bold text-sidebar-foreground text-sm truncate">
              Curió Conecta
            </h2>
            <p className="text-[11px] text-sidebar-foreground/50 truncate">
              {profile?.unidade || "Carregando..."}
            </p>
          </div>
        )}
      </div>

      {!collapsed && <Separator className="mx-4 w-auto opacity-30" />}

      <SidebarContent className="px-2 mt-1">
        {/* Home */}
        <MenuSection
          label="Principal"
          items={[{ title: "Início", url: "/", icon: LayoutDashboard }]}
          collapsed={collapsed}
        />

        {/* Comunicação */}
        <MenuSection label="Comunicação" items={comunicacaoItems} collapsed={collapsed} />

        {/* Área do colaborador */}
        {isColaborador && (
          <MenuSection label="Minha Área" items={colaboradorItems} collapsed={collapsed} />
        )}

        {/* RH */}
        {showRh && <MenuSection label="RH" items={rhItems} collapsed={collapsed} />}

        {/* Documentos */}
        {showDocs && <MenuSection label="Documentos" items={rhDocsItems} collapsed={collapsed} />}

        {/* Gerências */}
        {showGerencias && (
          <CollapsibleSection label="Gerências" items={gerenciaItems} collapsed={collapsed} />
        )}

        {/* Departamentos */}
        <MenuSection
          label="Departamentos"
          items={[{ title: "Departamentos", url: "/departamentos", icon: Building }]}
          collapsed={collapsed}
        />

        {/* Solicitações (gerente_loja) */}
        {showSolicitacoes && (
          <MenuSection label="Solicitações" items={solicitacoesItems} collapsed={collapsed} />
        )}

        {/* Reuniões */}
        {showReunioesFull ? (
          <MenuSection label="Reuniões" items={reunioesItems} collapsed={collapsed} />
        ) : (
          <MenuSection
            label="Reuniões"
            items={[reunioesItems[0], reunioesItems[2]]}
            collapsed={collapsed}
          />
        )}

        {/* Relatórios */}
        {showRelatórios && (
          <MenuSection
            label="Relatórios"
            items={[{ title: "Relatórios", url: "/relatorios", icon: FileText }]}
            collapsed={collapsed}
          />
        )}

        {/* Administração */}
        {canManageUsers && (
          <MenuSection
            label="Administração"
            items={[{ title: "Gestão de Usuários", url: "/gestao-usuarios", icon: UserCog }]}
            collapsed={collapsed}
          />
        )}

        {/* Ferramentas - Curiózinho */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-semibold">
              Ferramentas
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/assistente"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <CuriozinhoAvatar className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="text-sm">Curiózinho</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
