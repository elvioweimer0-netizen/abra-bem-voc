import { Trophy, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpcomingMilestones, milestoneYears, milestoneLabel } from "@/hooks/useUpcomingMilestones";
import { format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MilestonesWeekWidget() {
  const { data, isLoading } = useUpcomingMilestones(7);
  if (isLoading || !data?.length) return null;

  return (
    <Card className="border-amber-200/40 dark:border-amber-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-5 w-5 text-amber-500" />
          Marcos da semana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((m) => {
          const years = milestoneYears(m.milestone_type);
          const date = parseISO(m.milestone_date);
          const today = isToday(date);
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 rounded-lg p-2 ${
                today ? "bg-gradient-to-r from-amber-100 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/20" : ""
              }`}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={m.profile?.foto_url ?? undefined} />
                <AvatarFallback>{m.profile?.nome?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.profile?.nome ?? "Colaborador"}</p>
                <p className="text-xs text-muted-foreground">
                  {years ? `${years} ${years === 1 ? "ano" : "anos"} no Curió` : milestoneLabel(m.milestone_type)}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {today ? "Hoje" : format(date, "dd/MM", { locale: ptBR })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
