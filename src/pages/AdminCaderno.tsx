import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, EyeOff, Eye, Star } from "lucide-react";
import { Link } from "react-router-dom";
import {
  usePlaybookArticles,
  usePlaybookCategoriesAll,
  usePlaybookStats,
  useToggleArticleActive,
  useToggleFeatured,
  type PlaybookArticle,
  type PlaybookCategory,
} from "@/hooks/usePlaybook";
import { PlaybookArticleFormModal } from "@/components/playbook/PlaybookArticleFormModal";
import { PlaybookCategoryFormModal } from "@/components/playbook/PlaybookCategoryFormModal";

export default function AdminCaderno() {
  const { data: articles = [] } = usePlaybookArticles({ includeInactive: true });
  const { data: categories = [] } = usePlaybookCategoriesAll();
  const { data: stats } = usePlaybookStats();
  const toggleActive = useToggleArticleActive();
  const toggleFeatured = useToggleFeatured();

  const [editingArticle, setEditingArticle] = useState<PlaybookArticle | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PlaybookCategory | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Admin · Caderno do Gerente</h1>
        <p className="text-muted-foreground">Gerencie artigos, categorias e veja estatísticas</p>
      </header>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Artigos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-3 mt-4">
          <Button onClick={() => { setEditingArticle(null); setShowArticleForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo artigo
          </Button>
          <div className="space-y-2">
            {articles.map((a) => {
              const featured = a.featured_until && new Date(a.featured_until) > new Date();
              return (
                <Card key={a.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/caderno/${a.id}`} className="font-semibold hover:underline truncate">{a.title}</Link>
                      {!a.active && <Badge variant="outline">Inativo</Badge>}
                      {featured && <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Destaque</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {catMap[a.category_id]?.name} · v{a.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => toggleFeatured.mutate({ id: a.id, featured: !featured })}>
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive.mutate({ id: a.id, active: !a.active })}>
                      {a.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingArticle(a); setShowArticleForm(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-3 mt-4">
          <Button onClick={() => { setEditingCategory(null); setShowCategoryForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova categoria
          </Button>
          <div className="space-y-2">
            {categories.map((c) => (
              <Card key={c.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{c.name} <span className="text-xs text-muted-foreground ml-2">{c.code}</span></p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setEditingCategory(c); setShowCategoryForm(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Mais vistos</h3>
            <ul className="space-y-1 text-sm">
              {stats?.mostViewed.map((s) => (
                <li key={s.id} className="flex justify-between"><Link to={`/caderno/${s.id}`} className="hover:underline">{s.title}</Link><span className="text-muted-foreground">{s.count}</span></li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Mais úteis</h3>
            <ul className="space-y-1 text-sm">
              {stats?.mostUseful.map((s) => (
                <li key={s.id} className="flex justify-between"><Link to={`/caderno/${s.id}`} className="hover:underline">{s.title}</Link><span className="text-muted-foreground">{s.count}</span></li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Sem feedback</h3>
            <ul className="space-y-1 text-sm">
              {stats?.noFeedback.map((s) => (
                <li key={s.id}><Link to={`/caderno/${s.id}`} className="hover:underline">{s.title}</Link></li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>

      <PlaybookArticleFormModal
        open={showArticleForm}
        onClose={() => setShowArticleForm(false)}
        article={editingArticle}
        categories={categories}
      />
      <PlaybookCategoryFormModal
        open={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        category={editingCategory}
      />
    </div>
  );
}
