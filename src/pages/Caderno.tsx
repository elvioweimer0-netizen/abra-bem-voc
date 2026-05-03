import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { usePlaybookCategories, usePlaybookArticles } from "@/hooks/usePlaybook";
import { PlaybookCategoryList } from "@/components/playbook/PlaybookCategoryList";
import { PlaybookArticleCard } from "@/components/playbook/PlaybookArticleCard";

export default function Caderno() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: categories = [] } = usePlaybookCategories();
  const { data: articles = [], isLoading } = usePlaybookArticles({ categoryId: selected, search });
  const { data: allArticles = [] } = usePlaybookArticles({});

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    allArticles.forEach((a) => { m[a.category_id] = (m[a.category_id] ?? 0) + 1; });
    return m;
  }, [allArticles]);

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Caderno do Gerente</h1>
        <p className="text-muted-foreground">Playbook prático para liderar o dia a dia</p>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar artigos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-6">
        <aside>
          <PlaybookCategoryList
            categories={categories}
            selected={selected}
            onSelect={setSelected}
            counts={counts}
            totalCount={allArticles.length}
          />
        </aside>
        <main>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : articles.length === 0 ? (
            <p className="text-muted-foreground">Nenhum artigo encontrado.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {articles.map((a) => (
                <PlaybookArticleCard key={a.id} article={a} category={catMap[a.category_id]} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
