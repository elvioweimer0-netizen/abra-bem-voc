import {
  LayoutDashboard, Users, AlertTriangle, Ban, Building, FileText, Bot, LogOut,
  Megaphone, Heart, Bell, Video, CalendarDays, Plus, History, Camera,
  BookOpen, ClipboardList, FileCheck, Settings, UserCog,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

function MenuSection({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: MenuItem[];
  collapsed: boolean;
}) {
  return (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-xs tracking-wider">
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
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const mainItems: MenuItem[] = [
  { title: "Início", url: "/", icon: LayoutDashboard },
];

const comunicacaoItems: MenuItem[] = [
  { title: "Notícias", url: "/noticias", icon: Megaphone },
  { title: "Campanhas Internas", url: "/endomarketing", icon: Heart },
  { title: "Avisos", url: "/avisos", icon: Bell },
  { title: "Galeria do Curió", url: "/galeria", icon: Camera },
];

const rhAdminItems: MenuItem[] = [
  { title: "Colaboradores", url: "/colaboradores", icon: Users },
  { title: "Advertências", url: "/advertencias", icon: AlertTriangle },
  { title: "Suspensões", url: "/suspensoes", icon: Ban },
];

const rhDocsItems: MenuItem[] = [
  { title: "Código de Ética", url: "/rh/codigo-etica", icon: BookOpen },
  { title: "Cartilha Operacional", url: "/rh/cartilha", icon: ClipboardList },
  { title: "Políticas Internas", url: "/rh/politicas", icon: FileCheck },
];

const depItems: MenuItem[] = [
  { title: "Departamentos", url: "/departamentos", icon: Building },
];

const reunioesItems: MenuItem[] = [
  { title: "Entrar na Sala", url: "/reunioes", icon: Video },
  { title: "Criar Reunião", url: "/reunioes/criar", icon: Plus },
  { title: "Agenda", url: "/agenda", icon: CalendarDays },
  { title: "Histórico", url: "/reunioes/historico", icon: History },
];

const relatoriosItems: MenuItem[] = [
  { title: "Relatórios", url: "/relatorios", icon: FileText },
];

const adminItems: MenuItem[] = [
  { title: "Gestão de Usuários", url: "/gestao-usuarios", icon: UserCog },
];

const assistenteItems: MenuItem[] = [
  { title: "Assistente IA", url: "/assistente", icon: Bot },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, profile } = useAuth();
  const { isGestao, canManageUsers } = useRole();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="p-4 flex items-center gap-3">
        <img
          src="/logo-curio.png"
          alt="Curió"
          className="w-9 h-9 rounded-xl object-contain shrink-0 bg-card"
        />
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="font-bold text-sidebar-foreground text-sm truncate">
              Curió Conecta
            </h2>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {profile?.unidade || "Carregando..."}
            </p>
          </div>
        )}
      </div>

      <SidebarContent className="px-2">
        <MenuSection label="Principal" items={mainItems} collapsed={collapsed} />
        <MenuSection label="Comunicação" items={comunicacaoItems} collapsed={collapsed} />

        {isGestao && (
          <MenuSection label="RH" items={rhAdminItems} collapsed={collapsed} />
        )}
        <MenuSection label="Documentos" items={rhDocsItems} collapsed={collapsed} />

        <MenuSection label="Departamentos" items={depItems} collapsed={collapsed} />
        <MenuSection label="Reuniões" items={reunioesItems} collapsed={collapsed} />

        {isGestao && (
          <MenuSection label="Relatórios" items={relatoriosItems} collapsed={collapsed} />
        )}

        <MenuSection label="Ferramentas" items={assistenteItems} collapsed={collapsed} />
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
