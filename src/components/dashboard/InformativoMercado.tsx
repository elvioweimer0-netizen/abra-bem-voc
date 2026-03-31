import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";
import type { Noticia } from "@/types/database";

interface InformativoMercadoProps {
  noticias: Noticia[];
}

export function InformativoMercado({ noticias }: InformativoMercadoProps) {
  return (
    <Card className="card-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-primary" />
          </div>
          Informativo do Mercado
        </CardTitle>
      </CardHeader>
      <CardContent>
        {noticias.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            Nenhuma notícia no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {noticias.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm text-foreground">{n.titulo}</h3>
                  <div className="flex gap-1 shrink-0">
                    {n.importante && (
                      <Badge variant="destructive" className="text-xs">
                        Importante
                      </Badge>
                    )}
                    {n.unidade ? (
                      <Badge variant="outline" className="text-xs">
                        {n.unidade}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Geral
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {n.conteudo}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  {new Date(n.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
