import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Achievement, UserAchievement } from "@/hooks/useAchievements";

interface Props {
  achievement: Achievement;
  progress?: UserAchievement;
  locked?: boolean;
}

export function AchievementCard({ achievement, progress, locked }: Props) {
  const Icon = ((Icons as any)[achievement.icon ?? "Award"] ?? Icons.Award) as React.ComponentType<{ className?: string }>;
  const target = achievement.criteria_target ?? 1;
  const current = Number(progress?.current_progress ?? 0);
  const pct = Math.min(100, Math.round((current / target) * 100));
  const completed = progress?.completed;

  return (
    <Card className={cn(
      "p-4 flex flex-col gap-3 transition-all",
      completed && "border-primary bg-primary/5 shadow-md",
      locked && "opacity-60 grayscale",
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-12 w-12 shrink-0 rounded-full flex items-center justify-center",
          completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm truncate">{achievement.name}</h3>
            {completed && <Badge variant="default" className="text-[10px]">Desbloqueada</Badge>}
            {locked && <Badge variant="outline" className="text-[10px]">Bloqueada</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{achievement.description}</p>
        </div>
      </div>
      {!locked && (
        <div className="space-y-1">
          <Progress value={pct} className="h-1.5" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{current} / {target}</span>
            <span>{pct}%</span>
          </div>
        </div>
      )}
    </Card>
  );
}
