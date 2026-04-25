import { useEffect, useRef, useState } from "react";
import { Camera, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;
type Unit = { id: string; name: string; code: string };
type Inspection = { id: string; unit_id: string; data: string; score_organizacao: number; score_atendimento: number; score_estoque: number; score_limpeza: number; observacoes_gerais: string | null };
const labels = { score_organizacao: "Organização", score_atendimento: "Atendimento", score_estoque: "Estoque", score_limpeza: "Limpeza" } as const;

type ScoreKey = keyof typeof labels;

function Stars({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" className="flex h-10 w-10 items-center justify-center" onClick={() => onChange(n)}><Star className={`h-7 w-7 ${n <= value ? "fill-primary text-primary" : "text-muted-foreground"}`} /></button>)}</div>;
}

export default function Inspecoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [history, setHistory] = useState<Inspection[]>([]);
  const [fotos, setFotos] = useState<string[]>([]);
  const [form, setForm] = useState({ unit_id: "", score_organizacao: 3, score_atendimento: 3, score_estoque: 3, score_limpeza: 3, observacoes_gerais: "" });

  const load = async () => {
    const [{ data: unitData }, { data: inspectionData }] = await Promise.all([
      db.from("units").select("id, code, name").eq("active", true).order("code"),
      db.from("leadership_inspections").select("id, unit_id, data, score_organizacao, score_atendimento, score_estoque, score_limpeza, observacoes_gerais").order("data", { ascending: false }).limit(20),
    ]);
    setUnits(unitData || []);
    setHistory(inspectionData || []);
    if (!form.unit_id && unitData?.length) setForm((f) => ({ ...f, unit_id: unitData[0].id }));
  };

  useEffect(() => { load(); }, []);

  const uploadPhotos = async (files?: FileList | null) => {
    if (!files || !user) return;
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `inspecoes/${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("galeria").upload(path, file, { upsert: true });
      if (!error) urls.push(supabase.storage.from("galeria").getPublicUrl(path).data.publicUrl);
    }
    setFotos((current) => [...current, ...urls]);
  };

  const submit = async () => {
    if (!user || !form.unit_id) return;
    const { error } = await db.from("leadership_inspections").insert({ ...form, inspector_id: user.id, fotos });
    if (error) return toast({ title: "Erro ao registrar inspeção", description: error.message, variant: "destructive" });
    toast({ title: "Inspeção registrada" });
    setFotos([]); setForm((f) => ({ ...f, observacoes_gerais: "" })); load();
  };

  return <div className="space-y-5"><section className="rounded-xl bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">Roberto/Admin</p><h1 className="text-2xl font-bold text-foreground">Inspeção</h1></section>
    <Card><CardContent className="space-y-4 p-4"><Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}><SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger><SelectContent>{units.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select>{(Object.keys(labels) as ScoreKey[]).map((key) => <div key={key} className="rounded-lg border border-border p-3"><div className="mb-2 flex items-center justify-between"><p className="font-semibold text-foreground">{labels[key]}</p><span className="text-sm text-muted-foreground">{form[key]}/5</span></div><Stars value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} /></div>)}<Textarea placeholder="Observações" value={form.observacoes_gerais} onChange={(e) => setForm({ ...form, observacoes_gerais: e.target.value })} /><input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadPhotos(e.target.files)} /><Button variant="outline" className="min-h-12 w-full gap-2" onClick={() => fileRef.current?.click()}><Camera className="h-5 w-5" /> Fotos ({fotos.length})</Button><Button className="min-h-12 w-full" onClick={submit}>Registrar Inspeção</Button></CardContent></Card>
    <Card><CardContent className="space-y-3 p-4"><h2 className="font-bold text-foreground">Histórico</h2>{history.map((item) => { const unit = units.find((u) => u.id === item.unit_id); const avg = Math.round((item.score_organizacao + item.score_atendimento + item.score_estoque + item.score_limpeza) / 4); return <div key={item.id} className="rounded-lg border border-border p-3"><div className="flex justify-between"><p className="font-semibold">{unit?.name || "Unidade"}</p><p className="text-sm text-primary">{avg}/5</p></div><p className="text-xs text-muted-foreground">{new Date(item.data).toLocaleDateString("pt-BR")}</p><div className="mt-2 flex h-10 items-end gap-1">{[item.score_organizacao, item.score_atendimento, item.score_estoque, item.score_limpeza].map((score, i) => <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${score * 20}%` }} />)}</div></div>; })}</CardContent></Card>
  </div>;
}
