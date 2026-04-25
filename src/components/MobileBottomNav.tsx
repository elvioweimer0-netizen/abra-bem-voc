import { Bell, CalendarClock, Home, MoreHorizontal, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const items = [
  { label: "Início", href: "/", icon: Home },
  { label: "Avisos", href: "/avisos", icon: Bell, badge: true },
  { label: "Reuniões", href: "/reunioes-lideranca", icon: CalendarClock },
  { label: "Curiózinho", href: "/assistente", icon: Sparkles, featured: true },
  { label: "Mais", href: "/departamentos", icon: MoreHorizontal },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/98 pb-safe shadow-[0_-4px_18px_hsl(var(--foreground)/0.08)] md:hidden">
      <div className="grid h-16 grid-cols-5 items-center px-1">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            end={item.href === "/"}
            className="relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-muted-foreground transition-colors"
            activeClassName="text-primary font-semibold"
          >
            <span className={item.featured ? "-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg" : "relative"}>
              <item.icon className={item.featured ? "h-6 w-6" : "h-5 w-5"} />
              {item.badge && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />}
            </span>
            <span className="text-[11px] leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}