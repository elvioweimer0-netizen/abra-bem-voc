import { useEffect, useState } from "react";

export type HourContext = "manha" | "tarde" | "noite" | "madrugada";

export function getHourContext(d = new Date()): HourContext {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "manha";
  if (h >= 12 && h < 18) return "tarde";
  if (h >= 18 && h < 24) return "noite";
  return "madrugada";
}

export function useHourContext(): HourContext {
  const [ctx, setCtx] = useState<HourContext>(() => getHourContext());
  useEffect(() => {
    const id = setInterval(() => setCtx(getHourContext()), 60_000);
    return () => clearInterval(id);
  }, []);
  return ctx;
}
