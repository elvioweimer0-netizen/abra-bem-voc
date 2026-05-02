import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Q = {
  id?: string;
  question_text: string;
  options: string[];
  correct_index: number;
  ordem: number;
  _new?: boolean;
};

export function QuizEditor({ moduleId }: { moduleId: string }) {
  const [items, setItems] = useState<Q[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await (supabase as any)
      .from("quiz_questions")
      .select("*")
      .eq("module_id", moduleId)
      .order("ordem");
    setItems((data ?? []).map((q: any) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] })));
  }
  useEffect(() => { load(); }, [moduleId]);

  function addQuestion() {
    setItems([...items, { question_text: "", options: ["", ""], correct_index: 0, ordem: items.length, _new: true }]);
  }
  function update(i: number, patch: Partial<Q>) {
    setItems(items.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  }
  function addOption(i: number) {
    const q = items[i]; if (q.options.length >= 6) return;
    update(i, { options: [...q.options, ""] });
  }
  function removeOption(i: number, oi: number) {
    const q = items[i]; if (q.options.length <= 2) return;
    const opts = q.options.filter((_, idx) => idx !== oi);
    update(i, { options: opts, correct_index: Math.min(q.correct_index, opts.length - 1) });
  }
  async function remove(i: number) {
    const q = items[i];
    if (q.id) {
      const { error } = await (supabase as any).from("quiz_questions").delete().eq("id", q.id);
      if (error) { toast.error(error.message); return; }
    }
    setItems(items.filter((_, idx) => idx !== i));
  }

  async function save() {
    setLoading(true);
    try {
      for (const q of items) {
        if (!q.question_text.trim() || q.options.some((o) => !o.trim())) {
          toast.error("Preencha pergunta e todas as opções");
          setLoading(false); return;
        }
      }
      for (const q of items) {
        const payload = {
          module_id: moduleId,
          question_text: q.question_text,
          options: q.options,
          correct_index: q.correct_index,
          ordem: q.ordem,
        };
        if (q.id) {
          const { error } = await (supabase as any).from("quiz_questions").update(payload).eq("id", q.id);
          if (error) throw error;
        } else {
          const { error } = await (supabase as any).from("quiz_questions").insert(payload);
          if (error) throw error;
        }
      }
      toast.success("Perguntas salvas");
      load();
    } catch (e: any) {
      toast.error(e.message ?? String(e));
    } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          Perguntas do quiz
          <Button size="sm" variant="outline" onClick={addQuestion}><Plus className="mr-1 h-4 w-4" /> Adicionar</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pergunta. Adicione ao menos 1.</p>}
        {items.map((q, i) => (
          <div key={q.id ?? `new-${i}`} className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Label>Pergunta {i + 1}</Label>
                <Textarea value={q.question_text} onChange={(e) => update(i, { question_text: e.target.value })} rows={2} />
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div>
              <Label>Opções (marque a correta)</Label>
              <RadioGroup value={String(q.correct_index)} onValueChange={(v) => update(i, { correct_index: Number(v) })}>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <RadioGroupItem value={String(oi)} id={`q${i}-o${oi}`} />
                    <Input value={opt} onChange={(e) => {
                      const opts = [...q.options]; opts[oi] = e.target.value; update(i, { options: opts });
                    }} placeholder={`Opção ${oi + 1}`} />
                    <Button size="icon" variant="ghost" onClick={() => removeOption(i, oi)} disabled={q.options.length <= 2}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </RadioGroup>
              <Button size="sm" variant="ghost" className="mt-1" onClick={() => addOption(i)} disabled={q.options.length >= 6}>+ opção</Button>
            </div>
          </div>
        ))}
        <div className="flex justify-end"><Button onClick={save} disabled={loading || items.length === 0}>{loading ? "Salvando..." : "Salvar perguntas"}</Button></div>
      </CardContent>
    </Card>
  );
}
