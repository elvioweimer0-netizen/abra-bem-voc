import { Award, HeartHandshake, ShieldCheck, Sparkles, Users, type LucideIcon } from "lucide-react";
import type { CultureValue } from "@/hooks/useCulturePills";

const ICONS: Record<string, LucideIcon> = {
  "heart-handshake": HeartHandshake,
  award: Award,
  "shield-check": ShieldCheck,
  users: Users,
  sparkles: Sparkles,
};

export function CultureValueBadge({ value, size = "sm" }: { value?: CultureValue | null; size?: "sm" | "md" }) {
  if (!value) return null;
  const Icon = ICONS[value.icon] ?? Sparkles;
  const padding = size === "md" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${padding}`}
      style={{ backgroundColor: `${value.color}1f`, color: value.color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {value.name}
    </span>
  );
}
