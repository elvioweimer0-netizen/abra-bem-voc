import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, type CargoTipo } from "@/hooks/useRole";
import { useViewAs } from "@/contexts/ViewAsContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Bell, MapPin, User, Eye, Building } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import type { Enums } from "@/integrations/supabase/types";

/* ─── labels & config ─── */

const cargoLabels: Record<string, string> = {
  master: "👑 Master",
  admin: "👑 Admin",
  encarregado: "🧑‍💼 Encarregado",
  supervisor: "📊 Supervisor",
  adm_departamento: "📋 Adm. Departamento",
  gerente_adm: "📋 Gerente Adm.",
  gerente: "🏪 Gerente",
  gerente_loja: "🏪 Gerente Loja",
  lider: "🧑‍💼 Líder",
  colaborador: "👷 Colaborador",
};

const viewAsOptions: Enums<"cargo_tipo">[] = [
  "colaborador", "encarregado", "gerente", "admin",
];

const roleColorMap: Record<string, string> = {
  master: "bg-red-900/15 text-red-900",
  admin: "bg-red-700/15 text-red-700",
  encarregado: "bg-success/15 text-success",
  supervisor: "bg-purple-700/15 text-purple-700",
  adm_departamento: "bg-blue-700/15 text-blue-700",
  gerente_adm: "bg-blue-700/15 text-blue-700",
  gerente: "bg-amber-700/15 text-amber-700",
  gerente_loja: "bg-amber-700/15 text-amber-700",
  lider: "bg-emerald-700/15 text-emerald-700",
  colaborador: "bg-teal-600/15 text-teal-700",
};

/* ─── component ─── */

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { realCargo, isRealAdmin } = useRole();
  const { role, setRole, unidade, setUnidade } = useViewAs();

  const badgeClass = roleColorMap[role] || "bg-muted text-muted-foreground";
  const rootRoutes = ["/", "/avisos", "/reunioes-lideranca", "/assistente", "/minha-equipe"];
  const showBack = !rootRoutes.includes(location.pathname);

  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="relative flex h-14 items-center justify-between px-3 md:h-16 md:px-6">
        {/* Left: Sidebar trigger + branding */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <button className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted" onClick={() => navigate(-1)} aria-label="Voltar">
              <ArrowLeft className="h-6 w-6" />
            </button>
          ) : (
            <SidebarTrigger className="h-12 w-12 md:h-10 md:w-10" />
          )}
          <div className="hidden sm:flex items-center gap-2.5">
            <img src="/curio_logo_claro.png" alt="Curió Conecta" className="h-9 w-auto object-contain" />
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

        <img
          src="/curio_logo_claro.png"
          alt="Curió Conecta"
          className="absolute left-1/2 h-8 w-auto -translate-x-1/2 object-contain sm:hidden"
        />

        {/* Center: Role + Unit badges */}
        <div className="hidden lg:flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
            {cargoLabels[role] || role}
          </span>
          <span className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {unidade}
          </span>
          {profile?.gerencia && (
            <span className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground font-medium">
              {profile.gerencia.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Right: Selectors + User info */}
        <div className="flex items-center gap-1 md:gap-3">
          {isRealAdmin && (
            <>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as Enums<"cargo_tipo">)}
              >
                <SelectTrigger className="hidden h-10 w-[170px] text-xs sm:flex">
                  <Eye className="w-3.5 h-3.5 mr-1 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Visualizar como" />
                </SelectTrigger>
                <SelectContent>
                  {viewAsOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {cargoLabels[c]}
                    </SelectItem>
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
              <button className="relative flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground md:hidden" aria-label="Notificações">
                <Bell className="h-5 w-5" />
                <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold leading-none">{profile.nome}</p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {cargoLabels[realCargo]?.replace(/^.+\s/, "") || realCargo}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
