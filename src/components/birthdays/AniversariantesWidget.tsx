import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Cake, Check } from "lucide-react";
import { useAniversariantesHoje, useAniversariantesProximos7d, useMyTodayWishes, type AniversarianteHoje } from "@/hooks/useBirthdays";
import { ParabenizarModal } from "./ParabenizarModal";
import { useAuth } from "@/contexts/AuthContext";

const MES_NOMES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function initials(n?: string | null) {
  return (n ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

export function AniversariantesWidget() {
  const { user } = useAuth();
  const { data: hoje = [] } = useAniversariantesHoje();
  const { data: prox = [] } = useAniversariantesProximos7d();
  const { data: alreadyWished } = useMyTodayWishes();
  const [target, setTarget] = useState<AniversarianteHoje | null>(null);

  if (hoje.length === 0 && prox.length === 0) return null;

  return (
    <>
      <Card className="card-shadow border-rose-200 bg-rose-50/40 dark:bg-rose-950/10">
        <CardContent className="space-y-4 p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-rose-700 dark:text-rose-300">
            <Cake className="w-5 h-5" /> Aniversariantes
          </h2>

          {hoje.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700/80 dark:text-rose-300/80">Hoje 🎂</p>
              {hoje.map((p) => {
                const isMe = p.user_id === user?.id;
                const wished = alreadyWished?.has(p.user_id);
                return (
                  <div key={p.user_id} className="flex items-center gap-3 rounded-lg bg-background p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.foto_url ?? undefined} />
                      <AvatarFallback>{initials(p.nome)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold">{p.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.cargo_titulo ?? p.cargo} · {p.unidade}</p>
                    </div>
                    {isMe ? (
                      <span className="text-xs text-muted-foreground">é seu dia! 🎉</span>
                    ) : wished ? (
                      <Button size="sm" variant="ghost" disabled className="text-emerald-600"><Check className="w-4 h-4" /> Enviado</Button>
                    ) : (
                      <Button size="sm" onClick={() => setTarget(p)}>Parabenizar</Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum aniversariante hoje.</p>
          )}

          {prox.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="prox">
                <AccordionTrigger className="text-sm">Próximos 7 dias ({prox.length})</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {prox.map((p) => (
                      <li key={p.user_id} className="flex items-center gap-3 text-sm">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={p.foto_url ?? undefined} />
                          <AvatarFallback className="text-xs">{initials(p.nome)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{p.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">{p.cargo_titulo ?? p.cargo}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{String(p.dia).padStart(2, "0")}/{MES_NOMES[p.mes - 1]}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>

      {target && (
        <ParabenizarModal
          open={!!target}
          onOpenChange={(v) => { if (!v) setTarget(null); }}
          toUserId={target.user_id}
          toName={target.nome}
        />
      )}
    </>
  );
}
