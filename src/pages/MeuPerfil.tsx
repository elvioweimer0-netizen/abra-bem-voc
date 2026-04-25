import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationSettings } from "@/components/NotificationSettings";

export default function MeuPerfil() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
          <User className="h-6 w-6 text-primary" /> Meu Perfil
        </h1>
        <p className="text-sm text-muted-foreground">Dados de acesso e preferências</p>
      </div>

      <Card>
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="font-semibold text-foreground">{profile?.nome || "Usuário"}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <div className="flex flex-wrap gap-2">
              {profile?.cargo && <Badge>{profile.cargo}</Badge>}
              {profile?.unidade && <Badge variant="secondary">{profile.unidade}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <NotificationSettings />
    </div>
  );
}