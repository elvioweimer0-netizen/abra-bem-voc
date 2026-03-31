import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Cake, Star, Megaphone, Gift } from "lucide-react";
import type { Endomarketing } from "@/types/database";
import { useNavigate } from "react-router-dom";

interface EndomarketingSectionProps {
  items: Endomarketing[];
}

const tipoIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  aniversario: Cake,
  destaque: Star,
  campanha: Megaphone,
  mensagem: Gift,
};

const tipoColor: Record<string, string> = {
  aniversario: "bg-highlight/15 text-highlight-foreground",
  destaque: "bg-warning/10 text-warning",
  campanha: "bg-success/10 text-success",
  mensagem: "bg-primary/10 text-primary",
};

const tipoLabel: Record<string, string> = {
  aniversario: "🎂 Aniversário",
  destaque: "⭐ Destaque",
  campanha: "📢 Campanha",
  mensagem: "💌 Mensagem",
};

export function EndomarketingSection({ items }: EndomarketingSectionProps) {
  const navigate = useNavigate();

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            Vida no Curió
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-primary hover:text-primary"
            onClick={() => navigate("/endomarketing")}
          >
            Ver tudo <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma novidade de endomarketing por enquanto. Fique ligado! 💛</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.slice(0, 4).map((item) => {
              const Icon = tipoIcon[item.tipo] || Gift;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/20 hover:bg-muted/40 transition-all"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tipoColor[item.tipo] || "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{item.titulo}</h4>
                    {item.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.descricao}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {tipoLabel[item.tipo] || item.tipo}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
