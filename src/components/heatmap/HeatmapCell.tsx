import { cn } from "@/lib/utils";

const COLORS = [
  "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  "bg-amber-50 text-amber-700 hover:bg-amber-100",
  "bg-rose-50 text-rose-700 hover:bg-rose-100",
  "bg-rose-200 text-rose-900 hover:bg-rose-300",
];

export function HeatmapCell({
  value,
  thresholds,
  onClick,
}: {
  value: number;
  thresholds: [number, number];
  onClick?: () => void;
}) {
  const [low, mid] = thresholds;
  const level =
    value <= low ? 0 : value <= mid ? 1 : value <= mid * 2 + 1 ? 2 : 3;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-16 rounded-md text-2xl font-bold transition-colors flex items-center justify-center",
        COLORS[level],
      )}
    >
      {value}
    </button>
  );
}
