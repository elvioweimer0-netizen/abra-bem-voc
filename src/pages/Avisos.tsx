import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { AvisoEngagementSummary } from "@/components/avisos/AvisoEngagementSummary";
import { toast } from "sonner";
import type { Aviso } from "@/types/database";
import { Constants } from "@/integrations/supabase/types";
import { AvisoReadButton } from "@/components/AvisoReadButton";
import { AvisoReadStats } from "@/components/AvisoReadStats";

const unidades = Constants.public.Enums.unidade_tipo;

export default function Avisos() {
  const { profile } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Aviso | null>(null);
  const [form, setForm] = useState({ titulo: "", conteudo: "", unidade: "" as string, urgente: false, ativo: true });

  const canEdit = profile?.cargo === "admin" || profile?.cargo === "master" || profile?.cargo === "gerente" || profile?.cargo === "gerente_loja";
  const isAdmin = profile?.cargo === "admin" || profile?.cargo === "master";
  const canSeeStats = isAdmin || profile?.cargo === "supervisor" || canEdit;
  const isCentralAdm = profile?.unidade?.includes("CENTRAL");

  const fetchData = async () => {
    const { data } = await supabase.from("avisos").select("*").order("created_at", { ascending: false });
    setAvisos((data as Aviso[]) || []);
  };

  useEffect(() => { if (profile) fetchData(); }, [profile]);

  const resetForm = () => {
    setForm({ titulo: "", conteudo: "", unidade: "", urgente: false, ativo: true });
    setEditing(null);
  };

  const openEdit = (a: Aviso) => {
    setEditing(a);
    setForm({ titulo: a.titulo, conteudo: a.conteudo, unidade: a.unidade || "", urgente: a.urgente, ativo: a.ativo });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const unidadeValue = form.unidade && form.unidade !== "geral" ? form.unidade as typeof profile.unidade : null;
    const payload = {
      titulo: form.titulo,
      conteudo: form.conteudo,
      unidade: unidadeValue,
      urgente: form.urgente,
      ativo: form.ativo,
    };

    if (editing) {
      const { error } = await supabase.from("avisos").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Aviso atualizado!");
    } else {
      const { error } = await supabase.from("avisos").insert(payload);
      if (error) { toast.error(error.message); return; }
      if (isCentralAdm) {
        await supabase.from("notification_events").insert({ type: "weekly_report", title: `Comunicado Central ADM: ${form.titulo}`, body: form.conteudo.slice(0, 180), payload: { origem: "central_adm", canal: "avisos" } });
      }
      toast.success("Aviso criado!");
    }
    setOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("avisos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Aviso excluído!");
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" /> Avisos
          </h1>
          <p className="text-muted-foreground text-sm">Avisos urgentes e comunicações importantes</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2 sm:w-auto"><Plus className="w-4 h-4" /> Novo Aviso</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar Aviso" : "Novo Aviso"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
                <Textarea placeholder="Conteúdo" value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} required rows={4} />
                <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
                  <SelectTrigger><SelectValue placeholder="Unidade (geral se vazio)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral (todas)</SelectItem>
                    {(isAdmin ? unidades : [profile!.unidade]).map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch id="urgente" checked={form.urgente} onCheckedChange={(v) => setForm({ ...form, urgente: v })} />
                    <Label htmlFor="urgente">Urgente</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="ativo" checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
                    <Label htmlFor="ativo">Ativo</Label>
                  </div>
                </div>
                <Button type="submit" className="w-full">{editing ? "Salvar" : "Criar"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="card-shadow">
        <CardContent className="pt-6">
          <div className="space-y-3 md:hidden">
            {avisos.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum aviso.</p>
            ) : avisos.map((a) => (
              <article key={a.id} className="rounded-xl border border-border bg-card p-4">
                <Link to={`/avisos/${a.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-foreground hover:underline">{a.titulo}</h3>
                    <div className="flex shrink-0 gap-1">{a.urgente && <Badge variant="destructive">Urgente</Badge>}<Badge variant={a.ativo ? "default" : "secondary"}>{a.ativo ? "Ativo" : "Inativo"}</Badge></div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.unidade || "Geral"} · {new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{a.conteudo}</p>
                </Link>
                <div className="mt-2"><AvisoEngagementSummary avisoId={a.id} /></div>
                <div className="mt-3"><AvisoReadButton avisoId={a.id} /></div>
                {canSeeStats && <AvisoReadStats avisoId={a.id} unidade={a.unidade} />}
                {canEdit && <div className="mt-3 flex gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /> Editar</Button><Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}><Trash2 className="w-4 h-4 text-destructive" /> Excluir</Button></div>}
              </article>
            ))}
          </div>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                {canEdit && <TableHead className="w-24">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {avisos.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum aviso.</TableCell></TableRow>
              ) : avisos.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.titulo}</TableCell>
                  <TableCell>{a.unidade || "Geral"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {a.urgente && <Badge variant="destructive">Urgente</Badge>}
                      <Badge variant={a.ativo ? "default" : "secondary"}>{a.ativo ? "Ativo" : "Inativo"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
