import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ArrowRight } from "lucide-react";
import type { Noticia } from "@/types/database";
import { useNavigate } from "react-router-dom";

interface InformativoMercadoProps {
  noticias: Noticia[];
}

export function InformativoMercado({ noticias }: InformativoMercadoProps) {
  const navigate = useNavigate();

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-primary" />
            </div>
            Notícias do Curió
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-primary hover:text-primary"
            onClick={() => navigate("/noticias")}
          >
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {noticias.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma notícia publicada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {noticias.slice(0, 4).map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-lg border border-border/60 hover:border-primary/30 hover:bg-muted/40 transition-all cursor-pointer group"
                onClick={() => navigate("/noticias")}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {n.importante && (
                        <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-semibold px-1.5 py-0">
                          Importante
                        </Badge>
                      )}
                      {n.unidade ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {n.unidade}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Geral
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {n.titulo}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {n.conteudo}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-1">
                    {new Date(n.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
