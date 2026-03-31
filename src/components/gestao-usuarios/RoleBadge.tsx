import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const roleConfig: Record<string, { label: string; className: string }> = {
  master: { label: "Master", className: "bg-red-100 text-red-700 border-red-300" },
  admin: { label: "Admin", className: "bg-red-100 text-red-700 border-red-300" },
  adm_departamento: { label: "Adm. Depto", className: "bg-purple-100 text-purple-700 border-purple-300" },
  supervisor: { label: "Supervisor", className: "bg-blue-100 text-blue-700 border-blue-300" },
  lider: { label: "Líder", className: "bg-blue-100 text-blue-700 border-blue-300" },
  gerente: { label: "Gerente", className: "bg-orange-100 text-orange-700 border-orange-300" },
  colaborador: { label: "Colaborador", className: "bg-gray-100 text-gray-600 border-gray-300" },
};

export const roleLabels = Object.fromEntries(
  Object.entries(roleConfig).map(([k, v]) => [k, v.label])
);

export function RoleBadge({ role }: { role: string }) {
  const config = roleConfig[role] ?? roleConfig.colaborador;
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  );
}

export function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-xs",
        ativo
          ? "bg-emerald-100 text-emerald-700 border-emerald-300"
          : "bg-gray-100 text-gray-500 border-gray-300"
      )}
    >
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  );
}
