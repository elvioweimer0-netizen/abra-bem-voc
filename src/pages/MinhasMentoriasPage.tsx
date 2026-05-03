import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyMentorshipsAsMentor, useMyMentorshipsAsRequester, type MentorshipRequest } from "@/hooks/useMyMentorships";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Inbox, Send, Check, X, CheckCheck } from "lucide-react";

const STATUS: Record<string, { label: string; variant: any }> = {
  aberto: { label: "Aberto", variant: "secondary" },
  aceito: { label: "Aceito", variant: "default" },
  recusado: { label: "Recusado", variant: "destructive" },
  concluido: { label: "Concluído", variant: "outline" },
};

export default function MinhasMentoriasPage() {
  const qc = useQueryClient();
  const { data: asMentor, isLoading: lm } = useMyMentorshipsAsMentor();
  const { data: asReq, isLoading: lr } = useMyMentorshipsAsRequester();
  const [respondTarget, setRespondTarget] = useState<{ req: MentorshipRequest; status: "aceito" | "recusado" } | null>(null);
  const [responseText, setResponseText] = useState("");

  const respond = useMutation({
    mutationFn: async ({ id, status, text }: { id: string; status: string; text: string }) => {
      const { error } = await supabase
        .from("mentorship_requests")
        .update({ status, mentor_response: text || null, responded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-mentorships"] });
      toast.success("Resposta enviada");
      setRespondTarget(null);
      setResponseText("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const conclude = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mentorship_requests")
        .update({ status: "concluido" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-mentorships"] });
      toast.success("Marcado como concluído");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto p-4 space-y-4 pb-20">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Inbox className="h-6 w-6 text-primary" /> Minhas mentorias
        </h1>
      </header>

      <Tabs defaultValue="received">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received"><Inbox className="mr-2 h-4 w-4" /> Pediram ({asMentor?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="sent"><Send className="mr-2 h-4 w-4" /> Pedi ({asReq?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-3 mt-4">
          {lm ? <p className="text-sm">Carregando…</p> :
           !asMentor?.length ? <EmptyState text="Ninguém te pediu mentoria ainda" /> :
           asMentor.map((r) => (
            <RequestCard key={r.id} req={r} side="mentor"
              onAccept={() => setRespondTarget({ req: r, status: "aceito" })}
              onReject={() => setRespondTarget({ req: r, status: "recusado" })}
              onConclude={() => conclude.mutate(r.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3 mt-4">
          {lr ? <p className="text-sm">Carregando…</p> :
           !asReq?.length ? <EmptyState text="Você ainda não pediu nenhuma mentoria" /> :
           asReq.map((r) => (
            <RequestCard key={r.id} req={r} side="requester"
              onConclude={() => conclude.mutate(r.id)}
            />
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!respondTarget} onOpenChange={(v) => !v && setRespondTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{respondTarget?.status === "aceito" ? "Aceitar" : "Recusar"} pedido</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Mensagem (opcional)</Label>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder={respondTarget?.status === "aceito" ? "Combine horário/local…" : "Explica o motivo (opcional)"}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondTarget(null)}>Cancelar</Button>
            <Button
              onClick={() => respondTarget && respond.mutate({ id: respondTarget.req.id, status: respondTarget.status, text: responseText })}
              disabled={respond.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">{text}</CardContent></Card>;
}

interface CardProps {
  req: MentorshipRequest;
  side: "mentor" | "requester";
  onAccept?: () => void;
  onReject?: () => void;
  onConclude?: () => void;
}

function RequestCard({ req, side, onAccept, onReject, onConclude }: CardProps) {
  const status = STATUS[req.status];
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={req.other?.foto_url ?? undefined} />
              <AvatarFallback>{req.other?.nome?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{req.other?.nome}</p>
              <p className="text-xs text-muted-foreground truncate">
                {req.topic?.icon} {req.topic?.name} · {format(parseISO(req.created_at), "dd/MM HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-sm">{req.message}</div>

        {req.mentor_response && (
          <div className="rounded-md border-l-4 border-primary bg-primary/5 p-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground mb-1">Resposta:</p>
            {req.mentor_response}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {side === "mentor" && req.status === "aberto" && (
            <>
              <Button size="sm" onClick={onAccept}><Check className="mr-1 h-4 w-4" /> Aceitar</Button>
              <Button size="sm" variant="outline" onClick={onReject}><X className="mr-1 h-4 w-4" /> Recusar</Button>
            </>
          )}
          {req.status === "aceito" && (
            <Button size="sm" variant="outline" onClick={onConclude}>
              <CheckCheck className="mr-1 h-4 w-4" /> Marcar como concluído
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
