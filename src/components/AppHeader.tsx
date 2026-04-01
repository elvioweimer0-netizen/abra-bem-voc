import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useViewAs } from "@/contexts/ViewAsContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, User, Eye, Building } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import type { Enums } from "@/integrations/supabase/types";

const cargoLabels: Record<string, string> = {
  master: "👑 Master",
  admin: "👑 Admin",
  adm_departamento: "📋 Adm. Departamento",
  supervisor: "📊 Supervisor",
  gerente: "📊 Gerente",
  lider: "🧑‍💼 Líder",
  colaborador: "👷 Colaborador",
};

const viewAsOptions: Enums<"cargo_tipo">[] = ["admin", "gerente", "lider", "colaborador"];

export function AppHeader() {
  const { profile } = useAuth();
  const { realCargo, isRealAdmin } = useRole();
  const { role, setRole, unidade, setUnidade } = useViewAs();

  return (
    <header className="sticky top-0 z-20 border-b bg-card">
      <div className="flex min-h-[4rem] items-center justify-between px-4 md:px-6">
        {/* Left: Sidebar trigger + branding */}
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
              C
            </div>
            <div>
              <h1 className="text-base font-bold text-primary leading-tight">
                Curió Conecta
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Supermercado Curió
              </p>
            </div>
          </div>
        </div>

        {/* Center: Role + Unit badges */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium">
            {cargoLabels[role] || role}
          </span>
          <span className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {unidade}
          </span>
        </div>

        {/* Right: Selectors + User info */}
        <div className="flex items-center gap-2 md:gap-3">
          {isRealAdmin && (
            <>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as Enums<"cargo_tipo">)}
              >
                <SelectTrigger className="h-9 w-[150px] text-xs">
                  <Eye className="w-3.5 h-3.5 mr-1 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Visualizar como" />
                </SelectTrigger>
                <SelectContent>
                  {viewAsOptions.map((c) => (
                    <SelectItem key={c} value={c}>{cargoLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={unidade}
                onValueChange={(v) => setUnidade(v as Enums<"unidade_tipo">)}
              >
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <Building className="w-3.5 h-3.5 mr-1 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.unidade_tipo.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {profile && (
            <div className="flex items-center gap-2 ml-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold leading-none">{profile.nome}</p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {cargoLabels[realCargo]?.replace(/^.+\s/, '') || realCargo}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
