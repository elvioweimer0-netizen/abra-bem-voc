import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, type CargoTipo } from "@/hooks/useRole";
import { useViewAs } from "@/contexts/ViewAsContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Bell, Building, Eye, LogOut, Menu, Settings, User, UserCircle } from "lucide-react";
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
  const { profile, signOut } = useAuth();
  const { realCargo, isRealAdmin, isSupervisor } = useRole();
  const { role, setRole, unidade, setUnidade } = useViewAs();

  const rootRoutes = ["/", "/avisos", "/reunioes-lideranca", "/assistente", isSupervisor ? "/minhas-unidades" : "/minha-equipe"];
  const showBack = !rootRoutes.includes(location.pathname);
  const profileAny = profile as any;
  const displayCargo = profileAny?.cargo_titulo || cargoLabels[realCargo]?.replace(/^.+\s/, "") || realCargo;
  const displayUnit = isRealAdmin || isSupervisor || !profile?.unit_id ? "Todas as unidades" : profile?.unidade;
  const initials = (profile?.nome || "Usuário").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="relative flex h-14 items-center justify-between px-3 md:px-6">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted" onClick={() => navigate(-1)} aria-label="Voltar">
              <ArrowLeft className="h-6 w-6" />
            </button>
          ) : (
            <SidebarTrigger className="h-11 w-11 rounded-full" aria-label="Abrir menu completo">
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
          )}
        </div>

        <img
          src="/curio_logo_claro.png"
          alt="Curió Conecta"
          className="absolute left-1/2 h-8 w-auto -translate-x-1/2 object-contain"
        />
        
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex min-h-11 items-center gap-2 rounded-lg px-1 text-left transition-colors hover:bg-muted sm:px-2" aria-label="Abrir menu do perfil">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {profileAny?.foto_url ? <img src={profileAny.foto_url} alt={profile.nome} className="h-full w-full object-cover" /> : initials || <User className="h-4 w-4" />}
                    </div>
                    <div className="hidden max-w-[210px] sm:block text-right">
                      <p className="truncate text-sm font-semibold leading-none">{profile.nome}</p>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {displayCargo} • {displayUnit}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <p className="truncate">{profile.nome}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">{displayCargo} • {displayUnit}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/meu-perfil")}><UserCircle className="mr-2 h-4 w-4" /> Meu Perfil</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/gestao-usuarios")}><Settings className="mr-2 h-4 w-4" /> Configurações</DropdownMenuItem>
                  {(isRealAdmin || isSupervisor) && <DropdownMenuItem onClick={() => navigate("/minhas-unidades")}><Eye className="mr-2 h-4 w-4" /> Trocar de visualização</DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
