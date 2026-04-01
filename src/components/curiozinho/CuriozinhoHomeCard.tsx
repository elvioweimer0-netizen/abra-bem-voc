import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CuriozinhoAvatar } from "./CuriozinhoAvatar";

export function CuriozinhoHomeCard() {
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <CuriozinhoAvatar className="h-14 w-14" animated />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-base mb-1">
              Fale com o Curiózinho
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Tire dúvidas sobre RH, processos, documentos, setores e informações do mercado.
            </p>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/assistente">Abrir assistente</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
