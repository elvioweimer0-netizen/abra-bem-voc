import { usePainelMode } from "@/hooks/usePainelMode";

export function ModoToggle() {
  const { mode, setMode } = usePainelMode();
  return (
    <div className="inline-flex rounded-full bg-muted p-1 text-xs font-semibold">
      <button
        onClick={() => setMode("simples")}
        className={`px-3 py-1.5 rounded-full transition ${mode === "simples" ? "bg-background text-foreground shadow" : "text-muted-foreground"}`}
      >
        Simples
      </button>
      <button
        onClick={() => setMode("completo")}
        className={`px-3 py-1.5 rounded-full transition ${mode === "completo" ? "bg-background text-foreground shadow" : "text-muted-foreground"}`}
      >
        Completo
      </button>
    </div>
  );
}
