import { Bell, Home, LayoutDashboard, Megaphone, Menu, Sparkles, Trophy, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import { useRole } from "@/hooks/useRole";

type Item = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
  action?: "openMenu";
};

export function MobileBottomNav() {
  const { toggleSidebar } = useSidebar();
  const { isFeedUser, isSupervisor, isEncarregado, isGerente } = useRole();

  // Equipe rota dinâmica para líderes
  const equipeHref = isSupervisor
    ? "/minhas-unidades"
    : isEncarregado && !isGerente
      ? "/meu-setor"
      : "/minha-equipe";

  const leaderItems: Item[] = [
    { label: "Painel", href: "/", icon: LayoutDashboard },
    { label: "Equipe", href: equipeHref, icon: Users },
    { label: "Curiózinho", href: "/assistente", icon: Sparkles, featured: true },
    { label: "Avisos", href: "/avisos", icon: Megaphone },
    { label: "Mais", icon: Menu, action: "openMenu" },
  ];

  const feedItems: Item[] = [
    { label: "Início", href: "/", icon: Home },
    { label: "Avisos", href: "/avisos", icon: Bell },
    { label: "Curiózinho", href: "/assistente", icon: Sparkles, featured: true },
    { label: "Curió de Ouro", href: "/curio-de-ouro", icon: Trophy },
    { label: "Mais", icon: Menu, action: "openMenu" },
  ];

  const items = isFeedUser ? feedItems : leaderItems;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/98 backdrop-blur shadow-[0_-4px_18px_hsl(var(--foreground)/0.08)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação principal"
    >
      <div className="grid h-16 grid-cols-5 items-center px-1">
        {items.map((item) => {
          if (item.action === "openMenu") {
            return (
              <button
                key={item.label}
                type="button"
                onClick={toggleSidebar}
                className="relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-muted-foreground transition-colors active:scale-95"
                aria-label="Abrir menu completo"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[11px] leading-none">{item.label}</span>
              </button>
            );
          }
          return (
            <NavLink
              key={item.label}
              to={item.href!}
              end={item.href === "/"}
              className="relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-muted-foreground transition-colors active:scale-95"
              activeClassName="text-primary font-semibold"
            >
              <span
                className={
                  item.featured
                    ? "-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-card"
                    : ""
                }
              >
                <item.icon className={item.featured ? "h-6 w-6" : "h-5 w-5"} />
              </span>
              <span className="text-[11px] leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
