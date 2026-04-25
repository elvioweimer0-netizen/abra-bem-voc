import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, AlertTriangle, Ban, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { NotificationSettings } from "@/components/NotificationSettings";

type Colaborador = Tables<"colaboradores">;
type Advertencia = Tables<"advertencias">;
type Suspensao = Tables<"suspensoes">;

const setorLabels: Record<string, string> = {
  acougue: "Açougue",
  padaria: "Padaria",
  hortifruti: "Hortifruti",
  mercearia: "Mercearia",
  frente_de_caixa: "Frente de Caixa",
  deposito: "Depósito",
};

export default function ColaboradorPerfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [advertencias, setAdvertencias] = useState<Advertencia[]>([]);
  const [suspensoes, setSuspensoes] = useState<Suspensao[]>([]);

  useEffect(() => {
    if (!id || !profile) return;

    const fetchData = async () => {
      const [colabRes, advRes, suspRes] = await Promise.all([
        supabase.from("colaboradores").select("*").eq("id", id).single(),
        supabase.from("advertencias").select("*").eq("colaborador_id", id).order("data", { ascending: false }),
        supabase.from("suspensoes").select("*").eq("colaborador_id", id).order("data_inicio", { ascending: false }),
      ]);
      setColaborador(colabRes.data);
      setAdvertencias(advRes.data || []);
      setSuspensoes(suspRes.data || []);
    };

    fetchData();
  }, [id, profile]);

  if (!colaborador) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Perfil do Colaborador</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{colaborador.nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Matrícula</p>
                <p className="font-medium">{colaborador.matricula}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cargo</p>
                <p className="font-medium">{colaborador.cargo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Setor</p>
                <p className="font-medium">{setorLabels[colaborador.setor] || colaborador.setor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unidade</p>
                <p className="font-medium">{colaborador.unidade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={colaborador.status === "ativo" ? "default" : "secondary"}>
                  {colaborador.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile?.user_id === id && <NotificationSettings />}

      <Tabs defaultValue="historico">
        <TabsList>
          <TabsTrigger value="historico" className="gap-2">
            <Clock className="h-4 w-4" /> Histórico
          </TabsTrigger>
          <TabsTrigger value="advertencias" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Advertências ({advertencias.length})
          </TabsTrigger>
          <TabsTrigger value="suspensoes" className="gap-2">
            <Ban className="h-4 w-4" /> Suspensões ({suspensoes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico Completo</CardTitle>
            </CardHeader>
            <CardContent>
              {advertencias.length === 0 && suspensoes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum registro encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {[
                    ...advertencias.map((a) => ({
                      tipo: "Advertência" as const,
                      descricao: `${a.tipo} — ${a.motivo}`,
                      data: a.data,
                      responsavel: a.responsavel,
                    })),
                    ...suspensoes.map((s) => ({
                      tipo: "Suspensão" as const,
                      descricao: s.motivo,
                      data: s.data_inicio,
                      responsavel: s.responsavel,
                    })),
                  ]
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                        <Badge variant={item.tipo === "Advertência" ? "destructive" : "secondary"}>
                          {item.tipo}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.data).toLocaleDateString("pt-BR")} — {item.responsavel}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advertencias">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Responsável</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advertencias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma advertência registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    advertencias.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Badge variant={a.tipo === "verbal" ? "secondary" : "destructive"}>
                            {a.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{a.motivo}</TableCell>
                        <TableCell>{new Date(a.data).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{a.responsavel}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspensoes">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Responsável</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspensoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhuma suspensão registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    suspensoes.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.motivo}</TableCell>
                        <TableCell>{new Date(s.data_inicio).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{new Date(s.data_fim).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{s.responsavel}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
