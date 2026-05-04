import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Shift } from "@/hooks/useShifts";

export function CoverageChart({ shifts }: { shifts: Shift[] }) {
  const data = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2,"0")}h`, count: 0 }));
    for (const s of shifts) {
      if (s.status === "folga" || s.status === "falta") continue;
      const start = parseInt(s.shift_start.slice(0, 2), 10);
      const end = parseInt(s.shift_end.slice(0, 2), 10);
      const last = end === 0 ? 24 : end;
      for (let h = start; h < last; h++) hours[h].count++;
    }
    return hours;
  }, [shifts]);

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
