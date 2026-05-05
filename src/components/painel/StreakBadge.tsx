import { useStreak } from "@/hooks/useStreak";
import { Flame } from "lucide-react";

export function StreakBadge() {
  const streak = useStreak();
  if (streak < 3) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/15 text-warning text-xs font-semibold">
      <Flame className="w-3 h-3" /> {streak} dias seguidos
    </span>
  );
}
