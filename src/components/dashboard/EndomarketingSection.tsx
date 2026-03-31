import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Gift, Star, Megaphone } from "lucide-react";
import type { Endomarketing } from "@/types/database";
import { endomarketingTipoLabels } from "@/types/database";

interface EndomarketingSectionProps {
  items: Endomarketing[];
}

function endoIcon(tipo: string) {
  switch (tipo) {
    case "aniversario":
      return <Gift className="w-4 h-4 text-pink-500" />;
    case "destaque":
      return <Star className="w-4 h-4 text-amber-500" />;
    case "campanha":
      return <Megaphone className="w-4 h-4 text-primary" />;
    default:
      return <Heart className="w-4 h-4 text-rose-500" />;
  }
}

export function EndomarketingSection({ items }: EndomarketingSectionProps) {
  return (
    <Card className="card-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          Endomarketing
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            Nenhum conteúdo de endomarketing.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-border transition-colors"
              >
                <div className="mt-0.5">{endoIcon(e.tipo)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm text-foreground">{e.titulo}</h3>
                    <Badge variant="outline" className="text-xs">
                      {endomarketingTipoLabels[e.tipo]}
                    </Badge>
                  </div>
                  {e.descricao && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {e.descricao}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(e.data).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
