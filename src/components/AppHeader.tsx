import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useViewAs } from "@/contexts/ViewAsContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, Building, Eye, LogOut, Menu, Settings, User, UserCircle } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import type { Enums } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";

const cargoLabels: Record<string, string> = {
  master: "👑 Master",
  admin: "👑 Admin",
  supervisor: "📊 Supervisor",
  gerente: "🏪 Gerente",
  gerente_loja: "🏪 Gerente Loja",
  gerente_adm: "📋 Gerente Adm.",
  encarregado: "🧑‍💼 Encarregado",
  fiscal: "🛡️ Fiscal",
  lider_setor: "🧭 Líder de Setor",
  colaborador: "👷 Colaborador",
};

const viewAsOptions: Enums<"cargo_tipo">[] = [
  "master", "admin", "supervisor", "gerente", "gerente_loja",
  "gerente_adm", "encarregado", "fiscal", "lider_setor", "colaborador",
];

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { profile, signOut } = useAuth();
  const { realCargo, isRealAdmin, isSupervisor } = useRole();
  const { role, setRole, unidade, setUnidade } = useViewAs();

  const rootRoutes = ["/", "/avisos", "/reunioes-lideranca", "/assistente", "/curio-de-ouro", isSupervisor ? "/minhas-unidades" : "/minha-equipe"];
  const showBack = !rootRoutes.includes(location.pathname);
  const profileAny = profile as any;
  const displayCargo = profileAny?.cargo_titulo || cargoLabels[realCargo]?.replace(/^.+\s/, "") || realCargo;
  const displayUnit = isRealAdmin || isSupervisor || !profile?.unit_id ? "Todas as unidades" : profile?.unidade;
  const unitShort = displayUnit && displayUnit !== "Todas as unidades" ? String(displayUnit).split(" ")[0] : "REDE";
  const initials = (profile?.nome || "Usuário").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="relative flex h-14 items-center justify-between px-2 md:px-6">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          ) : (
            <SidebarTrigger className="h-11 w-11 rounded-full" aria-label="Abrir menu completo">
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
          )}
        </div>

        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <img
            src="/logos/conecta_lockup/conecta_curio_vermelho.png"
            alt="Conecta Curió"
            className="h-8 w-auto md:hidden"
          />
          <img
            src="/logos/conecta_lockup/conecta_curio_vermelho.png"
            alt="Conecta Curió"
            className="hidden h-10 w-auto md:block"
          />
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          {isRealAdmin && (
            <>
              <Select
                value={role ?? "__self"}
                onValueChange={(v) => setRole(v === "__self" ? null : (v as Enums<"cargo_tipo">))}
              >
                <SelectTrigger className="hidden h-10 w-[180px] text-xs lg:flex">
                  <Eye className="w-3.5 h-3.5 mr-1 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Visualizar como" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__self">👤 Eu mesmo (real)</SelectItem>
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
                <SelectTrigger className="hidden h-9 w-[160px] text-xs lg:flex">
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
            <div className="flex items-center gap-1 sm:gap-2">
              <Badge
                variant="outline"
                className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider border-primary/30 text-primary"
                title={String(displayUnit)}
              >
                {unitShort}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                    aria-label="Abrir notificações"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    Nenhuma notificação nova no momento.
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex min-h-11 items-center gap-2 rounded-lg px-1 text-left transition-colors hover:bg-muted sm:px-2"
                    aria-label="Abrir menu do perfil"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {profileAny?.foto_url ? (
                        <img src={profileAny.foto_url} alt={profile.nome} className="h-full w-full object-cover" />
                      ) : (
                        initials || <User className="h-4 w-4" />
                      )}
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
