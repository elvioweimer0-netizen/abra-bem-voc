import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BarChart3 } from "lucide-react";
import { usePolls } from "@/hooks/usePolls";
import { PollCard } from "@/components/polls/PollCard";
import { NovaPollModal } from "@/components/polls/NovaPollModal";
import { useRole } from "@/hooks/useRole";

export default function PollsListPage() {
  const [tab, setTab] = useState<"ativas" | "encerradas" | "minhas">("ativas");
  const [modal, setModal] = useState(false);
  const { isLider } = useRole();
  const { data: polls = [], isLoading } = usePolls(tab);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BarChart3 className="h-6 w-6 text-primary" /> Enquetes rápidas
          </h1>
          <p className="text-sm text-muted-foreground">Pulso rápido da equipe sobre o que importa.</p>
        </div>
        {isLider && (
          <Button onClick={() => setModal(true)}><Plus className="mr-1 h-4 w-4" /> Nova enquete</Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="ativas">Ativas</TabsTrigger>
          <TabsTrigger value="encerradas">Encerradas</TabsTrigger>
          <TabsTrigger value="minhas">Minhas</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 space-y-3">
          {isLoading ? (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">Carregando...</CardContent></Card>
          ) : polls.length === 0 ? (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">Nenhuma enquete por aqui.</CardContent></Card>
          ) : (
            polls.map((p) => <PollCard key={p.id} poll={p} />)
          )}
        </TabsContent>
      </Tabs>

      <NovaPollModal open={modal} onOpenChange={setModal} />
    </div>
  );
}
