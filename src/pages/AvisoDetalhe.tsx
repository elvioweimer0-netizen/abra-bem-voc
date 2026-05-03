import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import type { Aviso } from "@/types/database";
import { AvisoReadButton } from "@/components/AvisoReadButton";
import { AvisoReadStats } from "@/components/AvisoReadStats";
import { AvisoReactionBar } from "@/components/avisos/AvisoReactionBar";
import { AvisoComentarios } from "@/components/avisos/AvisoComentarios";

export default function AvisoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from("avisos").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setAviso(data as Aviso | null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!aviso) return (
    <div className="space-y-3">
      <Button asChild variant="ghost" size="sm"><Link to="/avisos"><ArrowLeft className="w-4 h-4" /> Voltar</Link></Button>
      <p>Aviso não encontrado.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/avisos"><ArrowLeft className="w-4 h-4" /> Voltar para Avisos</Link></Button>

      <Card className="card-shadow">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            {aviso.urgente && <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-1" />}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{aviso.titulo}</h1>
                {aviso.urgente && <Badge variant="destructive">Urgente</Badge>}
                {!aviso.ativo && <Badge variant="secondary">Inativo</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {aviso.unidade || "Geral"} · {new Date(aviso.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm">{aviso.conteudo}</p>
          <div><AvisoReadButton avisoId={aviso.id} /></div>
          <AvisoReadStats avisoId={aviso.id} unidade={aviso.unidade} />
          <div className="border-t pt-4">
            <AvisoReactionBar avisoId={aviso.id} />
          </div>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardContent className="pt-6">
          <AvisoComentarios avisoId={aviso.id} />
        </CardContent>
      </Card>
    </div>
  );
}
