import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTrainingModules } from "@/hooks/useTrainingModules";
import { ModuleCard, categoryLabels } from "@/components/treinamento/ModuleCard";
import { GraduationCap } from "lucide-react";

export default function Treinamento() {
  const { data, isLoading } = useTrainingModules();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    return (data ?? []).filter((m) => {
      if (cat !== "all" && m.category !== cat) return false;
      if (status !== "all" && m.status !== status) return false;
      if (q && !m.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, cat, status]);

  return (
    <div className="container max-w-6xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Treinamentos</h1>
          <p className="text-sm text-muted-foreground">Cápsulas curtas com vídeo + quiz. Concluir = 70% ou mais.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <Input placeholder="Buscar por título..." value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs" />
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="md:w-56"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-56"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="nao_fez">Não fiz</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="reprovado">Tentei e reprovei</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum módulo encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => <ModuleCard key={m.id} m={m} />)}
        </div>
      )}
    </div>
  );
}
