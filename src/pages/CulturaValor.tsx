import { useParams, Link } from "react-router-dom";
import { useCulturePillsList, useCultureValues } from "@/hooks/useCulturePills";
import { CulturePillCard } from "@/components/culture/CulturePillCard";
import { CultureValueBadge } from "@/components/culture/CultureValueBadge";
import { ArrowLeft } from "lucide-react";

export default function CulturaValor() {
  const { code } = useParams<{ code: string }>();
  const { data: values = [] } = useCultureValues();
  const value = values.find((v) => v.code === code);
  const { data, isLoading } = useCulturePillsList(code, 0, 50);

  return (
    <div className="space-y-6">
      <Link to="/cultura" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para Cultura
      </Link>

      {value && (
        <div
          className="rounded-lg border p-5"
          style={{ borderColor: value.color, backgroundColor: `${value.color}14` }}
        >
          <CultureValueBadge value={value} size="md" />
          <h1 className="mt-2 text-2xl font-bold text-foreground">{value.name}</h1>
          <p className="mt-1 text-foreground/80">{value.description}</p>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data?.pills.map((p) => <CulturePillCard key={p.id} pill={p} />)}
        </div>
      )}
    </div>
  );
}
