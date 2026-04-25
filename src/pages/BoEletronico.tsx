import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, MessageCircle, Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;
type Unit = { id: string; name: string; code: string };
type Person = { user_id: string; nome: string; cargo: string };
type BO = { id: string; unit_id: string; tipo: string; descricao: string; foto_url: string | null; gravidade: string; status: string; criado_em: string; atribuido_a: string | null; comments_count?: number };
const severityClass: Record<string, string> = { baixa: "border-success/30 bg-success/10", media: "border-warning/30 bg-warning/10", alta: "border-primary/30 bg-primary/10" };

export default function BoEletronico() {
  const { user, profile } = useAuth();
  const { canViewAll } = useRole();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [items, setItems] = useState<BO[]>([]);
  const [status, setStatus] = useState("aberto");
  const [selected, setSelected] = useState<BO | null>(null);
  const [form, setForm] = useState({ tipo: "outro", unit_id: "", descricao: "", gravidade: "media", atribuido_a: "" });
  const [photoUrl, setPhotoUrl] = useState("");
  const [comment, setComment] = useState("");

  const load = async () => {
    const [{ data: unitData }, { data: peopleData }, { data: boData }] = await Promise.all([
      db.from("units").select("id, code, name").eq("active", true).order("code"),
      db.from("profiles").select("user_id, nome, cargo").in("cargo", ["admin", "supervisor", "gerente", "encarregado", "lider"]),
      db.from("leadership_occurrences").select("id, unit_id, tipo, descricao, foto_url, gravidade, status, criado_em, atribuido_a, comments_count").eq("status", status).order("criado_em", { ascending: false }),
    ]);
    setUnits(unitData || []);
    setPeople(peopleData || []);
    setItems(boData || []);
    if (!form.unit_id && unitData?.length) setForm((f) => ({ ...f, unit_id: (profile as any)?.unit_id || unitData[0].id }));
  };

  useEffect(() => { load(); }, [status]);

  const uploadPhoto = async (file?: File) => {
    if (!file || !user) return;
    const path = `bo/${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("galeria").upload(path, file, { upsert: true });
    if (error) return toast({ title: "Erro na foto", description: error.message, variant: "destructive" });
    const { data } = supabase.storage.from("galeria").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
  };

  const submit = async () => {
    if (!user || !form.descricao.trim()) return;
    const { error } = await db.from("leadership_occurrences").insert({ ...form, foto_url: photoUrl || null, reportado_por: user.id, atribuido_a: form.atribuido_a || null });
    if (error) return toast({ title: "Erro ao registrar B.O.", description: error.message, variant: "destructive" });
    if (form.gravidade === "alta") toast({ title: "B.O. grave criado", description: "Admin e supervisor serão notificados." });
    setForm((f) => ({ ...f, descricao: "", gravidade: "media" }));
    setPhotoUrl("");
    load();
  };

  const resolve = async () => {
    if (!selected) return;
    await db.from("leadership_occurrences").update({ status: "resolvido", resolvido_em: new Date().toISOString() }).eq("id", selected.id);
    setSelected(null); load();
  };

  const addComment = async () => {
    if (!selected || !user || !comment.trim()) return;
    await db.from("occurrence_comments").insert({ occurrence_id: selected.id, user_id: user.id, comment });
    setComment(""); toast({ title: "Comentário adicionado" }); load();
  };

  return <div className="space-y-5"><section className="rounded-xl bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">Boletim de Ocorrência</p><h1 className="text-2xl font-bold text-foreground">+ Novo B.O.</h1></section>
    <Card><CardContent className="space-y-3 p-4"><Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="atendimento">Atendimento</SelectItem><SelectItem value="quebra">Quebra/Perda</SelectItem><SelectItem value="manutencao">Manutenção</SelectItem><SelectItem value="disciplina">Disciplina</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select><Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })} disabled={!canViewAll}><SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger><SelectContent>{units.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select><Textarea placeholder="Descrição do ocorrido" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /><input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} /><Button variant="outline" className="min-h-12 w-full gap-2" onClick={() => fileRef.current?.click()}><Camera className="h-5 w-5" /> {photoUrl ? "Trocar foto" : "Adicionar foto recomendada"}</Button><div className="grid grid-cols-3 gap-2">{["baixa", "media", "alta"].map((g) => <Button key={g} type="button" variant={form.gravidade === g ? "default" : "outline"} className="min-h-12 capitalize" onClick={() => setForm({ ...form, gravidade: g })}>{g}</Button>)}</div><Select value={form.atribuido_a} onValueChange={(v) => setForm({ ...form, atribuido_a: v })}><SelectTrigger><SelectValue placeholder="Atribuir a" /></SelectTrigger><SelectContent>{people.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>)}</SelectContent></Select><Button className="min-h-12 w-full gap-2" onClick={submit}><Send className="h-5 w-5" /> Registrar</Button></CardContent></Card>
    <div className="flex gap-2 overflow-x-auto pb-1">{["aberto", "em_tratamento", "resolvido"].map((s) => <Button key={s} variant={status === s ? "default" : "outline"} className="min-h-11 shrink-0" onClick={() => setStatus(s)}>{s.replace("_", " ")}</Button>)}</div>
    <div className="space-y-3">{items.map((bo) => <Card key={bo.id} className={severityClass[bo.gravidade]} onClick={() => setSelected(bo)}><CardContent className="p-4"><div className="flex justify-between gap-3"><h3 className="font-bold text-foreground">{bo.tipo}</h3><Badge>{bo.gravidade}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{bo.descricao}</p><p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><MessageCircle className="h-3.5 w-3.5" /> {bo.comments_count || 0} comentários</p></CardContent></Card>)}</div>
    <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}><DialogContent className="rounded-xl"><DialogHeader><DialogTitle>Detalhe do B.O.</DialogTitle></DialogHeader>{selected && <div className="space-y-3"><p className="text-sm text-muted-foreground">{selected.descricao}</p><Input placeholder="Adicionar comentário" value={comment} onChange={(e) => setComment(e.target.value)} /><Button variant="outline" className="min-h-12 w-full" onClick={addComment}>Comentar</Button><Button className="min-h-12 w-full gap-2" onClick={resolve}><CheckCircle2 className="h-5 w-5" /> Marcar como resolvido</Button></div>}</DialogContent></Dialog>
  </div>;
}
