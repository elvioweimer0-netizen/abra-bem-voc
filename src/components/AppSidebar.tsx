import {
  LayoutDashboard, Users, AlertTriangle, Ban, Building, FileText, Bot, LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

const rhItems = [
  { title: "Colaboradores", url: "/colaboradores", icon: Users },
  { title: "Advertências", url: "/advertencias", icon: AlertTriangle },
  { title: "Suspensões", url: "/suspensoes", icon: Ban },
];

const depItems = [
  { title: "Departamentos", url: "/departamentos", icon: Building },
];

const outrosItems = [
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Assistente IA", url: "/assistente", icon: Bot },
];

function MenuSection({ label, items, collapsed }: { label: string; items: typeof mainItems; collapsed: boolean }) {
  const location = useLocation();
  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-xs tracking-wider">{label}</SidebarGroupLabel>}
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, profile } = useAuth();

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
            <h2 className="font-bold text-sidebar-foreground text-sm truncate">Curió Conecta</h2>
            <p className="text-xs text-sidebar-foreground/50 truncate">{profile?.unidade || "Carregando..."}</p>
          </div>
        )}
      </div>

      <SidebarContent className="px-2">
        <MenuSection label="Principal" items={mainItems} collapsed={collapsed} />
        <MenuSection label="RH" items={rhItems} collapsed={collapsed} />
        <MenuSection label="Departamentos" items={depItems} collapsed={collapsed} />
        <MenuSection label="Outros" items={outrosItems} collapsed={collapsed} />
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
