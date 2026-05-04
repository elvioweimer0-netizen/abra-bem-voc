import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMyCoverageInvites } from "@/hooks/useMyCoverageInvites";
import { InviteCard } from "@/components/coverage/InviteCard";
import { HandHelping } from "lucide-react";

export default function MinhasCoberturasPage() {
  const { data: invites = [], isLoading } = useMyCoverageInvites();

  const groups = useMemo(() => ({
    pendente: invites.filter((i) => i.status === "pendente"),
    aceito: invites.filter((i) => i.status === "aceito"),
    historico: invites.filter((i) => i.status === "recusado" || i.status === "cancelado"),
  }), [invites]);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <HandHelping className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Minhas coberturas</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Convites de cobertura emergencial em outras lojas.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <Tabs defaultValue="pendente">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pendente">Pendentes ({groups.pendente.length})</TabsTrigger>
            <TabsTrigger value="aceito">Aceitas ({groups.aceito.length})</TabsTrigger>
            <TabsTrigger value="historico">Histórico ({groups.historico.length})</TabsTrigger>
          </TabsList>
          {(["pendente", "aceito", "historico"] as const).map((k) => (
            <TabsContent key={k} value={k} className="space-y-2 mt-3">
              {groups[k].length === 0 ? (
                <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nada por aqui ainda.</CardContent></Card>
              ) : (
                groups[k].map((inv) => <InviteCard key={inv.id} invite={inv} />)
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
