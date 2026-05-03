import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJourneysAdmin } from "@/hooks/useOnboarding";
import { JourneyRow } from "@/components/onboarding/JourneyRow";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function List({ status }: { status: string }) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useJourneysAdmin({ status });
  const filtered = (data ?? []).filter((r: any) => !search || (r.profile?.nome ?? "").toLowerCase().includes(search.toLowerCase()) || (r.profile?.unidade ?? "").toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-3">
      <Input placeholder="Buscar por nome ou unidade" value={search} onChange={(e) => setSearch(e.target.value)} />
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> :
        !filtered.length ? <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">Nenhuma jornada nesta lista.</CardContent></Card> :
        filtered.map((r: any) => <JourneyRow key={r.id} row={r} allowIncentive />)}
    </div>
  );
}

export default function AdminOnboarding() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin · Onboarding</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe as jornadas culturais da equipe.</p>
      </div>
      <Tabs defaultValue="em_andamento">
        <TabsList>
          <TabsTrigger value="em_andamento">Em andamento</TabsTrigger>
          <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
          <TabsTrigger value="concluido">Concluídos</TabsTrigger>
        </TabsList>
        <TabsContent value="em_andamento" className="mt-4"><List status="em_andamento" /></TabsContent>
        <TabsContent value="atrasado" className="mt-4"><List status="atrasado" /></TabsContent>
        <TabsContent value="concluido" className="mt-4"><List status="concluido" /></TabsContent>
      </Tabs>
    </div>
  );
}
