import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePulseWeekly } from "@/hooks/usePulseWeekly";
import { toast } from "@/hooks/use-toast";

export function PulsePrompt() {
  const { open, dismiss, question } = usePulseWeekly();
  const { profile } = useAuth();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!question || !profile?.user_id) return;
    if (!text.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("pulse_answers").insert({
      question_id: question.id,
      user_id: profile.user_id,
      unit_id: (profile as any).unit_id ?? null,
      answer_text: text.trim().slice(0, 500),
    });
    setSaving(false);
    if (error) {
      toast({ title: "Não foi possível enviar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Resposta enviada", description: "Sua resposta é anônima para a liderança." });
    setText("");
    dismiss(true);
  };

  if (!question) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss(true)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pulso da Semana</DialogTitle>
        </DialogHeader>
        <p className="text-sm font-medium">{question.question_text}</p>
        <p className="text-xs text-muted-foreground">Sua resposta é anônima. Líderes veem apenas o texto, sem identificação.</p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          rows={5}
          placeholder="Compartilhe o que está sentindo..."
        />
        <div className="flex justify-end gap-2 text-xs text-muted-foreground">
          <span>{text.length}/500</span>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => dismiss(true)} disabled={saving}>Agora não</Button>
          <Button onClick={submit} disabled={saving || !text.trim()}>Enviar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
