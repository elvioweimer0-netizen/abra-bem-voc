import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlaybookSuggestion } from "@/hooks/usePlaybook";

export function PlaybookSuggestionWidget() {
  const { data: article } = usePlaybookSuggestion();
  if (!article) return null;
  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Sugestão de leitura</p>
          <h3 className="font-semibold mt-1">{article.title}</h3>
          <Button size="sm" variant="link" className="px-0 mt-1" asChild>
            <Link to={`/caderno/${article.id}`}>Ler agora →</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
