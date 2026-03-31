import { Card, CardContent } from "@/components/ui/card";
import { MessageCircleHeart } from "lucide-react";
import type { Endomarketing } from "@/types/database";

interface MensagemColaboradorProps {
  mensagens: Endomarketing[];
}

export function MensagemColaborador({ mensagens }: MensagemColaboradorProps) {
  if (mensagens.length === 0) return null;

  const msg = mensagens[0];

  return (
    <Card className="card-shadow border-l-4 border-l-primary overflow-hidden">
      <CardContent className="p-5 sm:p-6 relative">
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary/5 pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <MessageCircleHeart className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
              Mensagem ao Colaborador
            </p>
            <h3 className="text-base font-bold text-foreground">{msg.titulo}</h3>
            {msg.descricao && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{msg.descricao}</p>
            )}
            <p className="text-xs text-muted-foreground/50 mt-2">
              {new Date(msg.data).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
