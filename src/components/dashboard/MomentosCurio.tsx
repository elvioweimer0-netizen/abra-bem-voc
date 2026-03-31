import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, ArrowRight, ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GaleriaItem {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  imagem_url: string;
  created_at: string;
}

export function MomentosCurio() {
  const navigate = useNavigate();
  const [fotos, setFotos] = useState<GaleriaItem[]>([]);

  useEffect(() => {
    supabase
      .from("galeria")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setFotos((data as GaleriaItem[]) || []));
  }, []);

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary" />
            </div>
            Momentos do Curió
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-primary hover:text-primary"
            onClick={() => navigate("/galeria")}
          >
            Ver galeria <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Nenhuma foto ainda. Em breve teremos momentos incríveis!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
              >
                <img
                  src={foto.imagem_url}
                  alt={foto.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="absolute bottom-2 left-2 right-2 text-primary-foreground text-xs font-medium truncate">
                    {foto.titulo}
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
