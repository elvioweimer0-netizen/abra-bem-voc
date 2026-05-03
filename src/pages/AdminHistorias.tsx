import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModerationStories, StoryStatus } from "@/hooks/useCurioStories";
import { ModeracaoHistoriaItem } from "@/components/historias/ModeracaoHistoriaItem";
import { Card, CardContent } from "@/components/ui/card";

function StoryList({ status }: { status: StoryStatus }) {
  const { data, isLoading } = useModerationStories(status);
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!data?.length) return <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhuma história nesta lista.</CardContent></Card>;
  return (
    <div className="space-y-4">
      {data.map((s) => <ModeracaoHistoriaItem key={s.id} story={s} />)}
    </div>
  );
}

export default function AdminHistorias() {
  const { data: pendentes } = useModerationStories("pendente");
  const count = pendentes?.length ?? 0;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin · Histórias</h1>
        <p className="text-sm text-muted-foreground mt-1">Modere as histórias submetidas pela equipe.</p>
      </div>
      <Tabs defaultValue="pendente">
        <TabsList>
          <TabsTrigger value="pendente">Pendentes ({count})</TabsTrigger>
          <TabsTrigger value="aprovada">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejeitada">Rejeitadas</TabsTrigger>
          <TabsTrigger value="arquivada">Arquivadas</TabsTrigger>
        </TabsList>
        <TabsContent value="pendente" className="mt-4"><StoryList status="pendente" /></TabsContent>
        <TabsContent value="aprovada" className="mt-4"><StoryList status="aprovada" /></TabsContent>
        <TabsContent value="rejeitada" className="mt-4"><StoryList status="rejeitada" /></TabsContent>
        <TabsContent value="arquivada" className="mt-4"><StoryList status="arquivada" /></TabsContent>
      </Tabs>
    </div>
  );
}
