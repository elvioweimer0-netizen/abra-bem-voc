import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMentorshipTopics } from "@/hooks/useMentorshipTopics";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface OfferState {
  enabled: boolean;
  message: string;
}

export function MentorshipOffersEditor() {
  const { user } = useAuth();
  const { data: topics } = useMentorshipTopics();
  const [state, setState] = useState<Record<string, OfferState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id || !topics) return;
    (async () => {
      const { data } = await supabase
        .from("user_mentorship_offers")
        .select("topic_id, message, active")
        .eq("user_id", user.id);
      const map: Record<string, OfferState> = {};
      for (const t of topics) map[t.id] = { enabled: false, message: "" };
      for (const o of data ?? []) {
        if (o.active) map[o.topic_id] = { enabled: true, message: o.message ?? "" };
      }
      setState(map);
      setLoading(false);
    })();
  }, [user?.id, topics]);

  async function save() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const enabled = Object.entries(state).filter(([, v]) => v.enabled);
      const disabled = Object.entries(state).filter(([, v]) => !v.enabled).map(([id]) => id);

      // Upsert enabled
      if (enabled.length) {
        const { error } = await supabase.from("user_mentorship_offers").upsert(
          enabled.map(([topic_id, v]) => ({
            user_id: user.id,
            topic_id,
            message: v.message || null,
            active: true,
          })),
          { onConflict: "user_id,topic_id" },
        );
        if (error) throw error;
      }
      // Delete disabled
      if (disabled.length) {
        await supabase
          .from("user_mentorship_offers")
          .delete()
          .eq("user_id", user.id)
          .in("topic_id", disabled);
      }
      toast.success("Tópicos salvos");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tô aberto a conversar sobre</CardTitle>
        <p className="text-sm text-muted-foreground">
          Marque os tópicos sobre os quais você toparia trocar uma ideia com colegas
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics?.map((t) => {
          const s = state[t.id] ?? { enabled: false, message: "" };
          return (
            <div key={t.id} className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`t-${t.id}`}
                  checked={s.enabled}
                  onCheckedChange={(v) =>
                    setState((p) => ({ ...p, [t.id]: { ...s, enabled: !!v } }))
                  }
                />
                <Label htmlFor={`t-${t.id}`} className="flex items-center gap-2 cursor-pointer">
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </Label>
              </div>
              {s.enabled && (
                <Textarea
                  className="mt-2"
                  placeholder="Mensagem opcional (ex: 'Tenho 5 anos no setor, posso compartilhar dicas')"
                  value={s.message}
                  maxLength={300}
                  onChange={(e) =>
                    setState((p) => ({ ...p, [t.id]: { ...s, message: e.target.value } }))
                  }
                />
              )}
            </div>
          );
        })}
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </CardContent>
    </Card>
  );
}
