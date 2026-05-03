import { Heart, ExternalLink, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToggleLike, type CulturePill } from "@/hooks/useCulturePills";
import { CultureValueBadge } from "./CultureValueBadge";

type Props = { pill: CulturePill | null; variant?: "full" | "compact" };

export function CulturePillCard({ pill, variant = "full" }: Props) {
  const toggle = useToggleLike();

  if (!pill) {
    return (
      <Card className="border-dashed border-border bg-muted/30">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Nenhuma pílula de cultura programada para hoje.
        </CardContent>
      </Card>
    );
  }

  const value = pill.value;
  const accent = value?.color ?? "#6366f1";

  return (
    <Card
      className="overflow-hidden border-border card-shadow"
      style={{ borderLeftWidth: 4, borderLeftColor: accent }}
    >
      <CardContent className={variant === "compact" ? "p-4" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Pílula de Cultura
            </span>
            <CultureValueBadge value={value} />
          </div>
        </div>

        <h3 className={`mt-2 font-bold text-foreground ${variant === "compact" ? "text-base" : "text-lg"}`}>
          {pill.title}
        </h3>
        <p className={`mt-1 text-foreground/80 ${variant === "compact" ? "text-sm" : "text-base"}`}>
          {pill.content}
        </p>

        {pill.image_url && variant === "full" && (
          <img src={pill.image_url} alt="" className="mt-3 max-h-60 w-full rounded-md object-cover" />
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant={pill.liked_by_me ? "default" : "outline"}
            onClick={() => toggle.mutate({ pillId: pill.id, liked: !!pill.liked_by_me })}
            disabled={toggle.isPending}
            className="gap-1.5"
            style={pill.liked_by_me ? { backgroundColor: accent, borderColor: accent } : undefined}
          >
            <Heart className={`h-4 w-4 ${pill.liked_by_me ? "fill-current" : ""}`} />
            <span>{pill.likes_count ?? 0}</span>
          </Button>
          {pill.link_url && (
            <a
              href={pill.link_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Saiba mais <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
