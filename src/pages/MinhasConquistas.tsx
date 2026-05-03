import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMyAchievements } from "@/hooks/useAchievements";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { useRole } from "@/hooks/useRole";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_LABELS: Record<string, string> = {
  disciplina: "Disciplina",
  lideranca: "Liderança",
  cultura: "Cultura",
  operacao: "Operação",
  treinamento: "Treinamento",
  tempo_curio: "Tempo de Curió",
  outros: "Outros",
};

export default function MinhasConquistas() {
  const { merged, isLoading } = useMyAchievements();
  const { cargo } = useRole();
  const [tab, setTab] = useState("todas");

  if (isLoading) {
    return <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  const filtered = merged.filter(({ achievement, progress }) => {
    if (tab === "desbloqueadas") return progress?.completed;
    if (tab === "em_progresso") return !progress?.completed && Number(progress?.current_progress ?? 0) > 0;
    if (tab === "bloqueadas") return achievement.role_filter && !achievement.role_filter.includes(cargo);
    return true;
  });

  const byCategory = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    (acc[item.achievement.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minhas Conquistas</h1>
        <p className="text-sm text-muted-foreground">Badges desbloqueadas pela sua trajetória na Curió</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="desbloqueadas">Desbloqueadas</TabsTrigger>
          <TabsTrigger value="em_progresso">Em progresso</TabsTrigger>
          <TabsTrigger value="bloqueadas">Bloqueadas</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="space-y-6 mt-4">
          {Object.entries(byCategory).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{CATEGORY_LABELS[cat] ?? cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(({ achievement, progress }) => {
                  const locked = !!achievement.role_filter && !achievement.role_filter.includes(cargo);
                  return <AchievementCard key={achievement.id} achievement={achievement} progress={progress} locked={locked} />;
                })}
              </div>
            </section>
          ))}
          {Object.keys(byCategory).length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma conquista nesta visão.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
