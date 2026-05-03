import * as Icons from "lucide-react";
import { Link } from "react-router-dom";
import { useRecentUnlocked } from "@/hooks/useAchievements";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function AchievementsBadgeRow({ userId }: { userId?: string }) {
  const { data, isLoading } = useRecentUnlocked(userId, 5);
  if (isLoading) return null;
  if (!data || data.length === 0) return null;
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {data.map((u) => {
          const a = u.achievement;
          if (!a) return null;
          const Icon = ((Icons as any)[a.icon ?? "Award"] ?? Icons.Award) as React.ComponentType<{ className?: string }>;
          return (
            <Tooltip key={u.id}>
              <TooltipTrigger asChild>
                <Link to="/perfil/conquistas" className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 hover:scale-110 transition-transform">
                  <Icon className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold text-xs">{a.name}</p>
                <p className="text-[11px] text-muted-foreground">{a.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
