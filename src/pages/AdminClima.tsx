import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClimateAccess } from "@/hooks/useClimateAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

function nextMonday(): string {
  const d = new Date();
  const diff = ((8 - d.getDay()) % 7) || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function AdminClima() {
  const { canManageClima } = useClimateAccess();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(nextMonday());
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  if (!canManageClima) return <Navigate to="/" replace />;

  const { data: questions = [] } = useQuery({
    queryKey: ["pulse-questions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pulse_questions").select("*").order("week_start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("pulse_questions").insert({
      week_start_date: weekStart,
      question_text: text.trim(),
      created_by: profile?.user_id ?? null,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Pergunta cadastrada" });
    setText("");
    qc.invalidateQueries({ queryKey: ["pulse-questions"] });
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("pulse_questions").update({ active }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else qc.invalidateQueries({ queryKey: ["pulse-questions"] });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Admin · Clima</h1>
        <p className="text-sm text-muted-foreground">Cadastre a pergunta do Pulso Semanal</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Nova pergunta</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
            <div>
              <label className="text-xs font-medium">Semana (segunda-feira)</label>
              <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Pergunta</label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} />
            </div>
          </div>
          <Button onClick={create} disabled={saving || !text.trim()}>Cadastrar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Semana</TableHead>
                <TableHead>Pergunta</TableHead>
                <TableHead>Ativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell>{new Date(q.week_start_date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="max-w-md">{q.question_text}</TableCell>
                  <TableCell>
                    <Switch checked={q.active} onCheckedChange={(v) => toggleActive(q.id, v)} />
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground">Nenhuma pergunta cadastrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
