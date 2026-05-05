import { useFraseDoDia } from "@/hooks/useFraseDoDia";

export function FraseDoDia() {
  const f = useFraseDoDia();
  if (!f) return null;
  return (
    <p className="text-xs italic text-muted-foreground">
      "{f.frase}"{f.autor ? ` — ${f.autor}` : ""}
    </p>
  );
}
