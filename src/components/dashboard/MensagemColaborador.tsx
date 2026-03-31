import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import type { Endomarketing } from "@/types/database";

interface MensagemColaboradorProps {
  mensagens: Endomarketing[];
}

export function MensagemColaborador({ mensagens }: MensagemColaboradorProps) {
  if (mensagens.length === 0) return null;

  return (
    <Card className="card-shadow border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          Mensagem ao Colaborador
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mensagens.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-lg bg-primary/5 border border-primary/10"
            >
              <h3 className="font-semibold text-sm text-foreground">{m.titulo}</h3>
              {m.descricao && (
                <p className="text-sm text-muted-foreground mt-1">{m.descricao}</p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-2">
                {new Date(m.data).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
