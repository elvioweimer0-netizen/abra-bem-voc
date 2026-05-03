import { useState } from "react";
import { Link } from "react-router-dom";
import { useCulturePillsList, useCultureValues } from "@/hooks/useCulturePills";
import { CulturePillCard } from "@/components/culture/CulturePillCard";
import { CultureValueBadge } from "@/components/culture/CultureValueBadge";
import { Button } from "@/components/ui/button";

export default function Cultura() {
  const [valueCode, setValueCode] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const { data: values = [] } = useCultureValues();
  const { data, isLoading } = useCulturePillsList(valueCode, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cultura Curió</h1>
        <p className="text-sm text-muted-foreground">Pílulas diárias para reforçar nossos valores.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={!valueCode ? "default" : "outline"}
          onClick={() => { setValueCode(undefined); setPage(0); }}
        >
          Todos
        </Button>
        {values.map((v) => (
          <button key={v.id} onClick={() => { setValueCode(v.code); setPage(0); }}>
            <CultureValueBadge value={v} size="md" />
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : data?.pills.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.pills.map((p) => (
            <Link key={p.id} to={`/cultura/valor/${p.value?.code ?? ""}`}>
              <CulturePillCard pill={p} />
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma pílula publicada ainda.</p>
      )}

      {data && data.total > (page + 1) * 12 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setPage(page + 1)}>Carregar mais</Button>
        </div>
      )}
    </div>
  );
}
