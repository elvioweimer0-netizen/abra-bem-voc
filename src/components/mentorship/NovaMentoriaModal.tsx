import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { MentorRow } from "@/hooks/useMentors";

interface Props {
  mentor: MentorRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NovaMentoriaModal({ mentor, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [topicId, setTopicId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!user?.id || !mentor) return;
    if (!topicId) return toast.error("Escolha o tópico");
    if (message.trim().length < 10) return toast.error("Escreva uma mensagem (mín. 10 caracteres)");
    setLoading(true);
    try {
      const { error } = await supabase.from("mentorship_requests").insert({
        requester_user_id: user.id,
        mentor_user_id: mentor.user_id,
        topic_id: topicId,
        message: message.trim(),
      });
      if (error) throw error;
      toast.success("Pedido enviado!");
      onOpenChange(false);
      setTopicId(""); setMessage("");
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pedir conversa com {mentor?.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tópico</Label>
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger><SelectValue placeholder="Sobre o que?" /></SelectTrigger>
              <SelectContent>
                {mentor?.topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sua mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conta brevemente o que você quer aprender ou conversar"
              rows={4}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Enviando…" : "Enviar pedido"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
