import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useViewAs } from "@/contexts/ViewAsContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, User, Eye, EyeOff, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Constants } from "@/integrations/supabase/types";

const cargoLabels: Record<string, string> = {
  master: "Master",
  admin: "Admin",
  adm_departamento: "Adm. Departamento",
  supervisor: "Supervisor",
  gerente: "Gerente",
  lider: "Líder",
  colaborador: "Colaborador",
};

const viewAsOptions = ["admin", "gerente", "lider", "colaborador"] as const;

export function AppHeader() {
  const { profile } = useAuth();
  const { realCargo, isRealAdmin } = useRole();
  const { simulatedCargo, simulatedUnidade, setSimulatedCargo, setSimulatedUnidade, isSimulating } = useViewAs();

  const displayUnidade = simulatedUnidade || profile?.unidade || "Carregando...";

  return (
    <header className="h-14 border-b bg-card flex items-center px-4 gap-3 shrink-0">
      <SidebarTrigger />
      <span className="text-sm font-semibold text-foreground hidden sm:inline">Curió Conecta</span>
      <div className="flex-1" />

      {/* Simulation banner */}
      {isSimulating && (
        <Badge variant="outline" className="gap-1.5 border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
          <Eye className="w-3 h-3" />
          Visualizando como: {cargoLabels[simulatedCargo || ""]}
        </Badge>
      )}

      {/* Admin: View As selector */}
      {isRealAdmin && (
        <div className="flex items-center gap-2">
          <Select
            value={simulatedCargo || "__real__"}
            onValueChange={(v) => setSimulatedCargo(v === "__real__" ? null : v as any)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <Eye className="w-3 h-3 mr-1 shrink-0" />
              <SelectValue placeholder="Visualizar como" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__real__">Meu perfil real</SelectItem>
              {viewAsOptions.map((c) => (
                <SelectItem key={c} value={c}>{cargoLabels[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Unit selector for admin */}
          <Select
            value={simulatedUnidade || "__real__"}
            onValueChange={(v) => setSimulatedUnidade(v === "__real__" ? null : v as any)}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <Building className="w-3 h-3 mr-1 shrink-0" />
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__real__">Minha unidade</SelectItem>
              {Constants.public.Enums.unidade_tipo.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isSimulating && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => { setSimulatedCargo(null); setSimulatedUnidade(null); }}
              title="Sair do modo de visualização"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {profile && (
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <MapPin className="w-3 h-3" />
            {displayUnidade}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-none">{profile.nome}</p>
              <p className="text-xs text-muted-foreground capitalize">{cargoLabels[realCargo] || realCargo}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
