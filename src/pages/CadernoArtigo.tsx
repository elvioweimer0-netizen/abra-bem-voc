import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Pencil, BookOpen, MessageSquare, Ban, Lightbulb, Video } from "lucide-react";
import { usePlaybookArticle, usePlaybookCategories } from "@/hooks/usePlaybook";
import { PlaybookArticleSection } from "@/components/playbook/PlaybookArticleSection";
import { PlaybookFeedbackBar } from "@/components/playbook/PlaybookFeedbackBar";
import { PlaybookArticleFormModal } from "@/components/playbook/PlaybookArticleFormModal";
import { useIsRhAdmin } from "@/hooks/useIsRhAdmin";

export default function CadernoArtigo() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading, feedback } = usePlaybookArticle(articleId);
  const { data: categories = [] } = usePlaybookCategories();
  const isRh = useIsRhAdmin();
  const [editing, setEditing] = useState(false);

  if (isLoading) return <div className="container mx-auto p-6">Carregando...</div>;
  if (!article) return <div className="container mx-auto p-6">Artigo não encontrado.</div>;

  const category = categories.find((c) => c.id === article.category_id);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-2xl md:text-3xl font-bold">{article.title}</h1>
          {isRh && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {category && <Link to="/caderno"><Badge variant="secondary">{category.name}</Badge></Link>}
          {article.tags?.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
          <span className="text-xs text-muted-foreground ml-auto">v{article.version}</span>
        </div>

        <div className="space-y-6">
          <PlaybookArticleSection title="Contexto" content={article.context} icon={<BookOpen className="h-4 w-4" />} />
          <PlaybookArticleSection title="Script" content={article.script} icon={<MessageSquare className="h-4 w-4" />} />
          <PlaybookArticleSection title="O que NÃO fazer" content={article.what_not_to_do} icon={<Ban className="h-4 w-4 text-destructive" />} />
          <PlaybookArticleSection title="Exemplo real" content={article.real_example} icon={<Lightbulb className="h-4 w-4 text-yellow-500" />} />
          {article.video_url && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Video className="h-4 w-4" /> Vídeo
              </h2>
              <a href={article.video_url} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                {article.video_url}
              </a>
            </section>
          )}
        </div>

        {articleId && <PlaybookFeedbackBar articleId={articleId} initial={feedback} />}
      </Card>

      <PlaybookArticleFormModal
        open={editing}
        onClose={() => setEditing(false)}
        article={article}
        categories={categories}
      />
    </div>
  );
}
