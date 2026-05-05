export function EmptySectorCard({ label }: { label: string }) {
  return (
    <div className="inline-flex flex-col items-center gap-1 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/20 px-4 py-3 min-w-[160px]">
      <p className="text-center text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground/70">Setor vazio</p>
    </div>
  );
}
