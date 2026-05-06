import {
  Home,
  MessageSquare,
  CheckSquare,
  Users,
  Store,
  Plus,
  Building,
  BookOpen,
  ChevronDown,
  LogOut,
  Settings,
  HeartPulse,
  Heart,
  CheckSquare as CheckIcon,
  Trophy,
  Upload,
  Crown,
  UserCircle,
  Video,
  ListChecks,
} from "lucide-react";
import { useState } from "react";
import { NavLink as RRNavLink, useLocation } from "react-router-dom";
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useRegistrar } from "@/components/nav/RegistrarModal";

type Item = { title: string; url?: string; icon: any; onClick?: () => void; show?: boolean; danger?: boolean };

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

function NavRow({ item, collapsed, onNavigate, highlight }: { item: Item; collapsed: boolean; onNavigate?: () => void; highlight?: boolean }) {
  const className = `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent ${
    highlight ? "bg-primary/15 text-primary hover:bg-primary/20 font-semibold" : "text-sidebar-foreground/80 hover:text-sidebar-accent-foreground"
  }`;

  if (item.onClick) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <button type="button" onClick={() => { item.onClick?.(); onNavigate?.(); }} className={className + " w-full text-left"}>
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span className="text-sm">{item.title}</span>}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url!}
          end={item.url === "/"}
          onClick={onNavigate}
          className={className}
          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
        >
          <item.icon className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span className="text-sm">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const menuCollapsed = isMobile ? false : collapsed;
  const { signOut, profile } = useAuth();
  const { cargo, isAdmin, isSupervisor, isLider } = useRole();
  const [moreOpen, setMoreOpen] = useState(false);
  const registrar = useRegistrar();

  const closeOnNav = () => isMobile && setOpenMobile(false);

  const showMinhaLoja = ["gerente_loja", "gerente", "encarregado", "supervisor", "admin", "master"].includes(cargo);

  const principal: Item[] = [
    { title: "Painel", url: "/", icon: Home },
    { title: "Comunicação", url: "/comunicacao", icon: MessageSquare },
    { title: "Meu Dia", url: "/meu-dia", icon: CheckSquare, show: isLider },
    { title: "Minha Equipe", url: "/minha-equipe", icon: Users },
    { title: "Minha Loja", url: "/minha-loja", icon: Store, show: showMinhaLoja },
    { title: "Registrar", icon: Plus, onClick: registrar.open },
    { title: "Unidades", url: "/unidades", icon: Building },
    { title: "Cultura", url: "/cultura-hub", icon: BookOpen },
    { title: "Reuniões", url: "/reunioes", icon: Video },
    { title: "Tarefas", url: "/tarefas", icon: ListChecks },
  ].filter((i) => i.show !== false);

  const mais: Item[] = [
    { title: "Meu Perfil", url: "/meu-perfil", icon: UserCircle },
    { title: "Curiózinho", url: "/assistente", icon: MessageSquare },
    { title: "Enquetes", url: "/polls", icon: CheckIcon },
    { title: "Marcos", url: "/admin/milestones", icon: Trophy, show: isAdmin },
    { title: "Bem-estar", url: "/bem-estar", icon: Heart },
    { title: "Canais de Apoio", url: "/bem-estar/recursos", icon: HeartPulse },
    { title: "Importar Colaboradores", url: "/admin/importar-colaboradores", icon: Upload, show: isAdmin },
    { title: "Painel Master", url: "/visao-geral-admin", icon: Crown, show: isAdmin },
    { title: "Gestão de Usuários", url: "/gestao-usuarios", icon: Settings, show: isAdmin },
    { title: "Configurações", url: "/meu-perfil", icon: Settings },
  ].filter((i) => i.show !== false);

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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {principal.map((it) => (
                <NavRow
                  key={it.title}
                  item={it}
                  collapsed={menuCollapsed}
                  onNavigate={closeOnNav}
                  highlight={it.title === "Registrar"}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? "" : "-rotate-90"}`} />
          {!menuCollapsed && <span>Mais</span>}
        </button>
        {moreOpen && (
          <SidebarMenu>
            {mais.map((it) => (
              <NavRow key={it.title} item={it} collapsed={menuCollapsed} onNavigate={closeOnNav} />
            ))}
          </SidebarMenu>
        )}
        <Separator className="my-1 opacity-30" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          {!menuCollapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
