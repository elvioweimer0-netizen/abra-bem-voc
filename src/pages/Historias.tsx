import { useState } from "react";
import { Plus, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useCultureValues } from "@/hooks/useCulturePills";
import { useApprovedStories } from "@/hooks/useCurioStories";
import { HistoriaCard } from "@/components/historias/HistoriaCard";
import { NovaHistoriaModal } from "@/components/historias/NovaHistoriaModal";
import { HistoriaFiltrosChips } from "@/components/historias/HistoriaFiltrosChips";

export default function Historias() {
  const [open, setOpen] = useState(false);
  const [valueId, setValueId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { data: values = [] } = useCultureValues();
  const { data, isLoading } = useApprovedStories({ valueId: valueId ?? undefined, search, page });

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Histórias do Curió</h1>
          <p className="text-sm text-muted-foreground mt-1">Momentos reais que mostram quem somos.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
          <Link to="/historias/hall-do-mes"><BookOpen className="h-4 w-4 mr-2" />Hall do mês</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Buscar por título" className="pl-9" />
        </div>
      </div>

      <HistoriaFiltrosChips values={values} selected={valueId} onSelect={(id) => { setValueId(id); setPage(0); }} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !data?.items.length ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Ainda não há histórias publicadas. Seja o primeiro!</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((s) => <HistoriaCard key={s.id} story={s} />)}
        </div>
      )}

      {data && data.total > 12 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <Button variant="outline" size="sm" disabled={(page + 1) * 12 >= data.total} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      )}

      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 shadow-lg rounded-full h-14 px-6 z-40"
      >
        <Plus className="h-5 w-5 mr-2" /> Contar uma história
      </Button>

      <NovaHistoriaModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
