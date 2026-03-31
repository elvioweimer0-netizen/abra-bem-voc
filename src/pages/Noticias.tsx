import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import type { Noticia } from "@/types/database";
import { Constants } from "@/integrations/supabase/types";

const unidades = Constants.public.Enums.unidade_tipo;

export default function Noticias() {
  const { profile } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Noticia | null>(null);
  const [form, setForm] = useState({ titulo: "", conteudo: "", unidade: "" as string, importante: false });

  const canEdit = profile?.cargo === "admin" || profile?.cargo === "gerente";
  const isAdmin = profile?.cargo === "admin";

  const fetchData = async () => {
    const { data } = await supabase.from("noticias").select("*").order("created_at", { ascending: false });
    setNoticias(data || []);
  };

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  const resetForm = () => {
    setForm({ titulo: "", conteudo: "", unidade: "", importante: false });
    setEditing(null);
  };

  const openEdit = (n: Noticia) => {
    setEditing(n);
    setForm({ titulo: n.titulo, conteudo: n.conteudo, unidade: n.unidade || "", importante: n.importante });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const payload = {
      titulo: form.titulo,
      conteudo: form.conteudo,
      unidade: form.unidade || null,
      importante: form.importante,
    };

    if (editing) {
      const { error } = await supabase.from("noticias").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Notícia atualizada!");
    } else {
      const { error } = await supabase.from("noticias").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Notícia criada!");
    }

    setOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("noticias").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Notícia excluída!");
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> Notícias
          </h1>
          <p className="text-muted-foreground text-sm">Informativo do mercado</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Notícia</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar Notícia" : "Nova Notícia"}</DialogTitle>
              </DialogHeader>
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
                <div className="flex items-center gap-2">
                  <Switch id="importante" checked={form.importante} onCheckedChange={(v) => setForm({ ...form, importante: v })} />
                  <Label htmlFor="importante">Marcar como importante</Label>
                </div>
                <Button type="submit" className="w-full">{editing ? "Salvar" : "Criar"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="card-shadow">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-24">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {noticias.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma notícia.</TableCell></TableRow>
              ) : noticias.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{n.titulo}</TableCell>
                  <TableCell>{n.unidade || "Geral"}</TableCell>
                  <TableCell>{new Date(n.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    {n.importante && <Badge variant="destructive">Importante</Badge>}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(n)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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
