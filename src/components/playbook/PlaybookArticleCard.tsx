import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { PlaybookArticle, PlaybookCategory } from "@/hooks/usePlaybook";

type Props = {
  article: PlaybookArticle & { viewed?: boolean };
  category?: PlaybookCategory;
};

export function PlaybookArticleCard({ article, category }: Props) {
  const featured = article.featured_until && new Date(article.featured_until) > new Date();
  const snippet = (article.context || "").replace(/[#*_>`]/g, "").slice(0, 140);
  return (
    <Link to={`/caderno/${article.id}`}>
      <Card className="p-4 hover:bg-accent/40 transition-colors h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-2">{article.title}</h3>
          {featured && <Star className="h-4 w-4 text-yellow-500 shrink-0" />}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {category && <Badge variant="secondary" className="text-xs">{category.name}</Badge>}
          {article.tags?.slice(0, 3).map((t) => (
            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">{snippet}</p>
        {article.viewed && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" /> Visto
          </div>
        )}
      </Card>
    </Link>
  );
}
