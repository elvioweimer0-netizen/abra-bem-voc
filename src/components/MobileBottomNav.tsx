import { Home, MessageSquare, Plus, Users, Menu } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import { useRegistrar } from "@/components/nav/RegistrarModal";

type Item = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
  action?: "openMenu" | "registrar";
};

export function MobileBottomNav() {
  const { toggleSidebar } = useSidebar();
  const registrar = useRegistrar();

  const items: Item[] = [
    { label: "Painel", href: "/", icon: Home },
    { label: "Comunicação", href: "/comunicacao", icon: MessageSquare },
    { label: "Registrar", icon: Plus, action: "registrar", featured: true },
    { label: "Equipe", href: "/minha-equipe", icon: Users },
    { label: "Mais", icon: Menu, action: "openMenu" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/98 backdrop-blur shadow-[0_-4px_18px_hsl(var(--foreground)/0.08)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação principal"
    >
      <div className="grid h-16 grid-cols-5 items-center px-1">
        {items.map((item) => {
          if (item.action) {
            const onClick = item.action === "openMenu" ? toggleSidebar : registrar.open;
            return (
              <button
                key={item.label}
                type="button"
                onClick={onClick}
                className="relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-muted-foreground transition-colors active:scale-95"
                aria-label={item.label}
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
              <item.icon className="h-5 w-5" />
              <span className="text-[11px] leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
