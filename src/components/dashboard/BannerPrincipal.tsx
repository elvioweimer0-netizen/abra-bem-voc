import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Noticia } from "@/types/database";
import { useNavigate } from "react-router-dom";

interface BannerPrincipalProps {
  noticia: Noticia | undefined;
}

export function BannerPrincipal({ noticia }: BannerPrincipalProps) {
  const navigate = useNavigate();

  if (!noticia) return null;

  return (
    <Card className="overflow-hidden border-0 gradient-curio-warm text-primary-foreground card-shadow-lg">
      <CardContent className="p-6 sm:p-8 relative">
        <img
          src="/curio_logo_vermelho.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 bottom-2 h-28 w-auto opacity-15 sm:h-40"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 shrink-0 opacity-80" />
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs font-semibold backdrop-blur-sm">
              {noticia.importante ? "🔥 Destaque Curió" : "📢 Informativo"}
            </Badge>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 leading-tight max-w-xl">
            {noticia.titulo}
          </h2>
          <p className="text-primary-foreground/80 text-sm sm:text-base line-clamp-3 max-w-2xl leading-relaxed">
            {noticia.conteudo}
          </p>

          <div className="flex items-center justify-between mt-6">
            <p className="text-primary-foreground/50 text-xs">
              {new Date(noticia.created_at).toLocaleDateString("pt-BR")}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 text-xs font-semibold shadow-md hover:shadow-lg transition-shadow"
              onClick={() => navigate("/noticias")}
            >
              Saiba mais
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
