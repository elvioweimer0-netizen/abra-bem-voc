import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurioStory, getStoryImageUrl, useToggleLike } from "@/hooks/useCurioStories";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function HistoriaCard({ story, compact = false }: { story: CurioStory; compact?: boolean }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const toggle = useToggleLike();

  useEffect(() => {
    let cancel = false;
    if (story.image_url) {
      getStoryImageUrl(story.image_url).then((u) => {
        if (!cancel) setImgUrl(u);
      });
    }
    return () => { cancel = true; };
  }, [story.image_url]);

  const initials = (story.author?.nome || "?").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const date = story.published_at ?? story.created_at;

  return (
    <Card className="card-shadow overflow-hidden">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold overflow-hidden">
              {story.author?.foto_url ? (
                <img src={story.author.foto_url} alt={story.author.nome ?? ""} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{story.author?.nome ?? "Anônimo"}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(date), "d 'de' MMM, yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          {story.value && (
            <Badge variant="outline" className="shrink-0">{story.value.name}</Badge>
          )}
        </div>

        <h3 className="text-lg font-bold text-foreground leading-snug">{story.title}</h3>

        <p className={cn("text-sm text-foreground/85 whitespace-pre-wrap", compact && "line-clamp-4")}>
          {story.content}
        </p>

        {imgUrl && (
          <div className="overflow-hidden rounded-lg border border-border">
            <img src={imgUrl} alt={story.title} className="w-full max-h-96 object-cover" loading="lazy" />
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <Button
            variant={story.liked_by_me ? "default" : "outline"}
            size="sm"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate({ storyId: story.id, liked: !!story.liked_by_me })}
            className="gap-2"
          >
            <Heart className={cn("h-4 w-4", story.liked_by_me && "fill-current")} />
            <span>{story.likes_count ?? 0}</span>
          </Button>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> História do Curió
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
