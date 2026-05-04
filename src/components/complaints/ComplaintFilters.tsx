import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ComplaintCategory, ComplaintSeverity, ComplaintStatus } from "@/hooks/useComplaints";
import { X } from "lucide-react";

const ALL = "_all";

export function ComplaintFilters({
  category, severity, status,
  onChange,
}: {
  category: ComplaintCategory | null;
  severity: ComplaintSeverity | null;
  status: ComplaintStatus | null;
  onChange: (next: {
    category: ComplaintCategory | null;
    severity: ComplaintSeverity | null;
    status: ComplaintStatus | null;
  }) => void;
}) {
  const cats: ComplaintCategory[] = ["atendimento","produto","preco","fila","limpeza","estoque","outros"];
  const sevs: ComplaintSeverity[] = ["leve","media","grave","muito_grave"];
  const stats: ComplaintStatus[] = ["aberta","em_andamento","resolvida"];

  const setCat = (v: string) => onChange({ category: v === ALL ? null : (v as ComplaintCategory), severity, status });
  const setSev = (v: string) => onChange({ category, severity: v === ALL ? null : (v as ComplaintSeverity), status });
  const setStatus = (v: string) => onChange({ category, severity, status: v === ALL ? null : (v as ComplaintStatus) });

  const hasFilter = category || severity || status;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={category ?? ALL} onValueChange={setCat}>
        <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas categorias</SelectItem>
          {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={severity ?? ALL} onValueChange={setSev}>
        <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Gravidade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas gravidades</SelectItem>
          {sevs.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={status ?? ALL} onValueChange={setStatus}>
        <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos status</SelectItem>
          {stats.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ category: null, severity: null, status: null })}>
          <X className="h-4 w-4 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}
