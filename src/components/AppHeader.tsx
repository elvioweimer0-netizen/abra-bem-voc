import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { MapPin, User } from "lucide-react";

export function AppHeader() {
  const { profile } = useAuth();

  return (
    <header className="h-14 border-b bg-card flex items-center px-4 gap-4 shrink-0">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground hidden sm:inline">Curió Conecta</span>
      </div>
      <div className="flex-1" />
      {profile && (
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <MapPin className="w-3 h-3" />
            {profile.unidade}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-none">{profile.nome}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile.cargo}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
