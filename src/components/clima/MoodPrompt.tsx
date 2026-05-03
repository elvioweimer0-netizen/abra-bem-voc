import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyMoodPrompt } from "@/hooks/useDailyMoodPrompt";
import { toast } from "@/hooks/use-toast";

const OPTIONS = [
  { score: 1, emoji: "😞", label: "Péssimo" },
  { score: 2, emoji: "😕", label: "Ruim" },
  { score: 3, emoji: "😐", label: "Normal" },
  { score: 4, emoji: "🙂", label: "Bom" },
  { score: 5, emoji: "😄", label: "Ótimo" },
];

export function MoodPrompt() {
  const { open, dismiss } = useDailyMoodPrompt();
  const { profile } = useAuth();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (score: number | null, skipped = false) => {
    if (!profile?.user_id || !(profile as any)?.unit_id) {
      dismiss(true);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("daily_mood").insert({
      user_id: profile.user_id,
      unit_id: (profile as any).unit_id,
      score,
      skipped,
      note: note.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
      return;
    }
    if (!skipped) toast({ title: "Obrigado!", description: "Seu humor foi registrado." });
    dismiss(true);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss(true)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Como você está hoje?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.score}
              disabled={saving}
              onClick={() => submit(o.score)}
              className="flex flex-col items-center gap-1 rounded-xl border bg-card p-3 transition hover:border-primary hover:bg-primary/5"
            >
              <span className="text-3xl">{o.emoji}</span>
              <span className="text-xs font-medium">{o.label}</span>
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Quer comentar algo? (opcional)"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => submit(null, true)} disabled={saving}>Pular hoje</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
