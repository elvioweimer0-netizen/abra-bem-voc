import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, ArrowRight } from "lucide-react";
import type { Noticia } from "@/types/database";
import { useNavigate } from "react-router-dom";

interface BannerPrincipalProps {
  noticia: Noticia | undefined;
}

export function BannerPrincipal({ noticia }: BannerPrincipalProps) {
  const navigate = useNavigate();

  if (!noticia) return null;

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-primary/75 text-primary-foreground card-shadow-lg">
      <CardContent className="p-6 sm:p-8 relative">
        {/* decorative circle */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary-foreground/5 pointer-events-none" />
        <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-primary-foreground/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-5 h-5 shrink-0" />
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs font-semibold">
              {noticia.importante ? "🔥 Destaque" : "📢 Informativo"}
            </Badge>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
            {noticia.titulo}
          </h2>
          <p className="text-primary-foreground/80 text-sm sm:text-base line-clamp-3 max-w-2xl">
            {noticia.conteudo}
          </p>

          <div className="flex items-center justify-between mt-5">
            <p className="text-primary-foreground/50 text-xs">
              {new Date(noticia.created_at).toLocaleDateString("pt-BR")}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 text-xs font-medium"
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
