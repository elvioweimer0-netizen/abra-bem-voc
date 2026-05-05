import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function PerguntaProCurio() {
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!q.trim()) return;
    setLoading(true);
    setA(null);
    try {
      const { data, error } = await supabase.functions.invoke("ask-curio", { body: { question: q } });
      if (error) throw error;
      setA((data as any)?.answer ?? "Sem resposta.");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao perguntar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Pergunta pro Curió
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex: qual gerente teve mais queda mês passado?"
            onKeyDown={(e) => e.key === "Enter" && ask()}
          />
          <Button onClick={ask} disabled={loading} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        {a && (
          <div className="text-sm bg-muted/40 rounded-lg p-3 whitespace-pre-wrap">{a}</div>
        )}
      </CardContent>
    </Card>
  );
}
