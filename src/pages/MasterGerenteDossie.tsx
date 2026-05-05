import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function MasterGerenteDossie() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [novaNota, setNovaNota] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["dossie_profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", id!).maybeSingle();
      return data;
    },
  });

  const { data: scores = [] } = useQuery({
    queryKey: ["dossie_scores", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("manager_scores_monthly")
        .select("year,month,final_score")
        .eq("user_id", id!)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["dossie_notes", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("master_manager_notes")
        .select("*")
        .eq("manager_user_id", id!)
        .eq("master_user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function salvarNota() {
    if (!novaNota.trim() || !user || !id) return;
    const { error } = await supabase.from("master_manager_notes").insert({
      manager_user_id: id,
      master_user_id: user.id,
      note: novaNota,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Nota salva");
      setNovaNota("");
      qc.invalidateQueries({ queryKey: ["dossie_notes"] });
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-xl">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.foto_url ?? undefined} />
            <AvatarFallback>{profile?.nome?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{profile?.nome}</h1>
            <p className="text-sm text-muted-foreground">{profile?.unidade ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader><CardTitle className="text-base">Scores (últimos 12 meses)</CardTitle></CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem scores registrados.</p>
          ) : (
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {scores.map((s) => (
                <div key={`${s.year}-${s.month}`} className="text-center">
                  <div className="h-16 flex items-end">
                    <div
                      className="w-full bg-primary/70 rounded-t"
                      style={{ height: `${(Number(s.final_score) / 100) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] mt-1">{s.month}/{s.year.toString().slice(2)}</p>
                  <p className="text-[10px] font-bold">{Number(s.final_score).toFixed(0)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader><CardTitle className="text-base">Suas notas privadas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={novaNota}
              onChange={(e) => setNovaNota(e.target.value)}
              placeholder="Anote algo só pra você sobre este gerente..."
              rows={2}
            />
            <Button onClick={salvarNota}>Salvar</Button>
          </div>
          <div className="space-y-2">
            {notes.map((n: any) => (
              <div key={n.id} className="text-sm bg-muted/40 rounded p-2">
                <p>{n.note}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
