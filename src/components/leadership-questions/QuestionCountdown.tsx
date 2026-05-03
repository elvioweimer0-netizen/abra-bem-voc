import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function QuestionCountdown({ deadlineDate }: { deadlineDate: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(i);
  }, []);
  const dl = new Date(deadlineDate + "T23:59:59").getTime();
  const diff = dl - now;
  if (diff <= 0) return <span className="text-sm text-destructive flex items-center gap-1"><Clock className="h-3 w-3" /> Prazo encerrado</span>;
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  const label = days >= 1 ? `${days}d ${hours % 24}h` : `${hours}h`;
  return (
    <span className="text-sm text-muted-foreground flex items-center gap-1">
      <Clock className="h-3 w-3" /> Restam {label} até o prazo
    </span>
  );
}
