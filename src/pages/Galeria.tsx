import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Plus, ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Constants } from "@/integrations/supabase/types";

const categorias = ["equipe", "eventos", "campanhas", "loja", "destaques"] as const;
const unidades = Constants.public.Enums.unidade_tipo;

const catLabel: Record<string, string> = {
  equipe: "Equipe",
  eventos: "Eventos",
  campanhas: "Campanhas",
  loja: "Loja",
  destaques: "Destaques",
};

interface GaleriaItem {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  unidade: string | null;
  imagem_url: string;
  created_at: string;
}

export default function Galeria() {
  const { user } = useAuth();
  const { isGestao } = useRole();
  const [fotos, setFotos] = useState<GaleriaItem[]>([]);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", categoria: "equipe", unidade: "" });
  const [file, setFile] = useState<File | null>(null);

  const fetchData = () => {
    let query = supabase.from("galeria").select("*").order("created_at", { ascending: false });
    if (filterCat !== "all") query = query.eq("categoria", filterCat as any);
    query.then(({ data }) => setFotos((data as GaleriaItem[]) || []));
  };

  useEffect(() => { fetchData(); }, [filterCat]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !form.titulo) {
      toast({ title: "Preencha o título e selecione uma imagem", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user?.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("galeria").upload(path, file);
    if (uploadErr) {
      toast({ title: "Erro no upload", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("galeria").getPublicUrl(path);
    const { error } = await supabase.from("galeria").insert({
      titulo: form.titulo,
      descricao: form.descricao || null,
      categoria: form.categoria as any,
      unidade: (form.unidade || null) as any,
      imagem_url: urlData.publicUrl,
      publicado_por: user?.id,
    });
    setUploading(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Foto publicada com sucesso!" });
      setOpen(false);
      setFile(null);
      setForm({ titulo: "", descricao: "", categoria: "equipe", unidade: "" });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" /> Galeria do Curió
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Momentos especiais da nossa equipe</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>{catLabel[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isGestao && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" /> Nova Foto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Publicar Foto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Label>Título *</Label>
                    <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categorias.map((c) => <SelectItem key={c} value={c}>{catLabel[c]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Unidade</Label>
                      <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
                        <SelectTrigger><SelectValue placeholder="Geral" /></SelectTrigger>
                        <SelectContent>
                          {unidades.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Imagem *</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </div>
                  <Button type="submit" disabled={uploading} className="w-full">
                    {uploading ? "Enviando..." : "Publicar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {fotos.length === 0 ? (
        <Card className="card-shadow">
          <CardContent className="py-16 text-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma foto na galeria ainda. Em breve teremos momentos incríveis do Curió!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fotos.map((foto) => (
            <Card key={foto.id} className="card-shadow overflow-hidden group">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={foto.imagem_url}
                  alt={foto.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm text-foreground">{foto.titulo}</h3>
                {foto.descricao && <p className="text-xs text-muted-foreground mt-0.5">{foto.descricao}</p>}
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="secondary" className="text-[10px]">{catLabel[foto.categoria] || foto.categoria}</Badge>
                  <span className="text-[10px] text-muted-foreground">{new Date(foto.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
