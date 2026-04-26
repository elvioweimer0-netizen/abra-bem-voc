import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon, Camera, CheckCircle2, FileDown, Image as ImageIcon, Mail, MessageCircle, Send, Share2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

type Unit = { id: string; name: string; code: string };
type Person = { user_id: string; nome: string; cargo: string };
type ProfileLite = { user_id: string; nome: string };
type Occurrence = {
  id: string;
  unit_id: string;
  titulo: string;
  tipo?: string;
  descricao: string;
  motivos: string[];
  setor: string | null;
  urgencia: "baixa" | "media" | "alta";
  gravidade?: "baixa" | "media" | "alta";
  fotos: string[];
  foto_url: string | null;
  custo_estimado: number | null;
  prazo_desejado: string | null;
  observacao: string | null;
  status: string;
  criado_em: string;
  reportado_por: string;
  atribuido_a: string | null;
  comments_count?: number;
};

const reasons = [
  { value: "manutencao", label: "🔧 Manutenção" },
  { value: "rh", label: "👔 RH" },
  { value: "dp", label: "💼 DP" },
  { value: "supervisao", label: "👁️ Supervisão" },
  { value: "diretor", label: "👑 Diretor" },
  { value: "marketing", label: "📢 Marketing" },
  { value: "comercial", label: "🛒 Comercial" },
  { value: "financeiro", label: "💰 Financeiro" },
  { value: "ti", label: "💻 TI" },
  { value: "administrativo", label: "🏢 Administrativo" },
  { value: "operacional", label: "⚠️ Operacional/Loja" },
];

const sectors = ["Açougue", "Padaria", "Hortifruti", "Mercearia", "Frente de Caixa", "Depósito", "Geral", "Não se aplica"];
const urgencyClass: Record<string, string> = { baixa: "border-l-success", media: "border-l-warning", alta: "border-l-primary" };
const statusLabels: Record<string, string> = { aberto: "Aberta", em_tratamento: "Em tratamento", resolvido: "Resolvida" };
const periodDays: Record<string, number | null> = { "7": 7, "30": 30, "90": 90, all: null };

function money(value?: number | null) {
  if (!value) return "";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function normalizeMotivos(value: unknown, fallback?: string) {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return [value];
    }
  }
  return fallback ? [fallback] : [];
}

export default function BoEletronico() {
  const { user, profile } = useAuth();
  const { canViewAll, isColaborador } = useRole();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [authors, setAuthors] = useState<ProfileLite[]>([]);
  const [items, setItems] = useState<Occurrence[]>([]);
  const [selected, setSelected] = useState<Occurrence | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [status, setStatus] = useState("all");
  const [urgency, setUrgency] = useState("all");
  const [period, setPeriod] = useState("30");
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({ titulo: "", unit_id: "", descricao: "", motivos: [] as string[], setor: "", urgencia: "media", custo_estimado: "", prazo_desejado: undefined as Date | undefined, observacao: "", atribuido_a: "" });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const authorMap = useMemo(() => new Map(authors.map((author) => [author.user_id, author.nome])), [authors]);
  const unitMap = useMemo(() => new Map(units.map((unit) => [unit.id, unit.name])), [units]);

  const load = async () => {
    let query = db.from("leadership_occurrences").select("id, unit_id, titulo, tipo, descricao, motivos, setor, urgencia, gravidade, fotos, foto_url, custo_estimado, prazo_desejado, observacao, status, criado_em, reportado_por, atribuido_a, comments_count").order("criado_em", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    if (urgency !== "all") query = query.eq("urgencia", urgency);
    const days = periodDays[period];
    if (days) query = query.gte("criado_em", new Date(Date.now() - days * 86400000).toISOString());

    const [{ data: unitData }, { data: peopleData }, { data: occurrenceData }, { data: authorData }] = await Promise.all([
      db.from("units").select("id, code, name").eq("active", true).order("code"),
      db.from("profiles").select("user_id, nome, cargo").in("cargo", ["admin", "supervisor", "gerente", "gerente_loja", "encarregado", "lider", "adm_departamento", "gerente_adm"]),
      query,
      db.from("profiles").select("user_id, nome"),
    ]);

    setUnits(unitData || []);
    setPeople(peopleData || []);
    setAuthors(authorData || []);
    setItems((occurrenceData || []).map((item: any) => ({
      ...item,
      titulo: item.titulo || item.descricao?.slice(0, 72) || "Ocorrência",
      motivos: normalizeMotivos(item.motivos, item.tipo),
      urgencia: item.urgencia || item.gravidade || "media",
      fotos: Array.isArray(item.fotos) && item.fotos.length ? item.fotos : item.foto_url ? [item.foto_url] : [],
    })));
    if (!form.unit_id && unitData?.length) setForm((current) => ({ ...current, unit_id: (profile as any)?.unit_id || unitData[0].id }));
  };

  useEffect(() => { load(); }, [status, urgency, period]);

  const visibleItems = useMemo(() => {
    if (!reasonFilter.length) return items;
    return items.filter((item) => reasonFilter.every((reason) => item.motivos.includes(reason)));
  }, [items, reasonFilter]);

  const toggleFormReason = (reason: string) => {
    setForm((current) => ({ ...current, motivos: current.motivos.includes(reason) ? current.motivos.filter((item) => item !== reason) : [...current.motivos, reason] }));
  };

  const toggleReasonFilter = (reason: string) => {
    setReasonFilter((current) => current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]);
  };

  const uploadPhotos = async (files?: FileList | null) => {
    if (!files || !user) return;
    const selectedFiles = Array.from(files).slice(0, 5 - photos.length);
    if (!selectedFiles.length) return toast({ title: "Limite atingido", description: "Você pode anexar até 5 fotos por ocorrência." });
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of selectedFiles) {
        const path = `ocorrencias/${user.id}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("galeria").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("galeria").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setPhotos((current) => [...current, ...urls].slice(0, 5));
    } catch (error) {
      toast({ title: "Erro ao enviar foto", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!user) return;
    if (!form.titulo.trim() || !form.descricao.trim() || !form.motivos.length) {
      return toast({ title: "Preencha os campos obrigatórios", description: "Título, descrição e pelo menos um motivo são obrigatórios.", variant: "destructive" });
    }
    if (form.descricao.length > 500) return toast({ title: "Descrição muito longa", description: "Use no máximo 500 caracteres.", variant: "destructive" });

    const primaryReason = form.motivos[0] === "operacional" ? "outro" : form.motivos[0] === "manutencao" ? "manutencao" : "outro";
    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      motivos: form.motivos,
      setor: form.setor || null,
      urgencia: form.urgencia,
      gravidade: form.urgencia,
      tipo: primaryReason,
      fotos: photos,
      foto_url: photos[0] || null,
      custo_estimado: form.custo_estimado ? Number(form.custo_estimado) : null,
      prazo_desejado: form.prazo_desejado ? format(form.prazo_desejado, "yyyy-MM-dd") : null,
      observacao: form.observacao.trim() || null,
      unit_id: form.unit_id,
      reportado_por: user.id,
      atribuido_a: form.atribuido_a || null,
    };
    const { error } = await db.from("leadership_occurrences").insert(payload);
    if (error) return toast({ title: "Erro ao registrar ocorrência", description: error.message, variant: "destructive" });
    toast({ title: "Ocorrência registrada", description: "As áreas responsáveis serão notificadas." });
    setForm((current) => ({ ...current, titulo: "", descricao: "", motivos: [], setor: "", urgencia: "media", custo_estimado: "", prazo_desejado: undefined, observacao: "", atribuido_a: "" }));
    setPhotos([]);
    load();
  };

  const resolve = async () => {
    if (!selected) return;
    await db.from("leadership_occurrences").update({ status: "resolvido", resolvido_em: new Date().toISOString() }).eq("id", selected.id);
    setSelected(null);
    load();
  };

  const addComment = async () => {
    if (!selected || !user || !comment.trim()) return;
    await db.from("occurrence_comments").insert({ occurrence_id: selected.id, user_id: user.id, comment });
    setComment("");
    toast({ title: "Comentário adicionado" });
    load();
  };

  const occurrenceSummary = (item: Occurrence) => [`Ocorrência: ${item.titulo}`, `Urgência: ${item.urgencia}`, `Motivos: ${item.motivos.map((m) => reasons.find((r) => r.value === m)?.label || m).join(", ")}`, `Unidade: ${unitMap.get(item.unit_id) || "-"}`, `Descrição: ${item.descricao}`].join("\n");

  const exportPdf = () => {
    if (!selected) return;
    const html = `<html><head><title>${selected.titulo}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#33190F}header{border-bottom:3px solid #B63533;margin-bottom:24px;padding-bottom:12px}h1{font-size:24px}.meta{color:#6B5B54}.box{border:1px solid #eadbd4;border-radius:12px;padding:16px;margin:12px 0}img{max-width:180px;border-radius:10px;margin:6px}</style></head><body><header><h1>Curió Conecta — Relatório de Ocorrência</h1><p class="meta">Assinatura digital: ${authorMap.get(selected.reportado_por) || profile?.nome || "Usuário"}</p></header><h2>${selected.titulo}</h2><div class="box"><p><b>Status:</b> ${statusLabels[selected.status]}</p><p><b>Urgência:</b> ${selected.urgencia}</p><p><b>Motivos:</b> ${selected.motivos.map((m) => reasons.find((r) => r.value === m)?.label || m).join(", ")}</p><p><b>Setor:</b> ${selected.setor || "Não informado"}</p><p><b>Custo estimado:</b> ${money(selected.custo_estimado) || "Não informado"}</p><p><b>Prazo desejado:</b> ${selected.prazo_desejado ? format(new Date(selected.prazo_desejado), "dd/MM/yyyy") : "Não informado"}</p></div><div class="box"><b>Descrição</b><p>${selected.descricao}</p>${selected.observacao ? `<b>Observação</b><p>${selected.observacao}</p>` : ""}</div>${selected.fotos.length ? `<div class="box"><b>Fotos</b><br>${selected.fotos.map((src) => `<img src="${src}" />`).join("")}</div>` : ""}</body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const shareWhatsapp = () => {
    if (!selected) return;
    const text = `${occurrenceSummary(selected)}\n\nLink: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const sendEmail = () => {
    if (!selected || !emailTo.trim()) return;
    window.location.href = `mailto:${emailTo.trim()}?subject=${encodeURIComponent(`Ocorrência: ${selected.titulo}`)}&body=${encodeURIComponent(occurrenceSummary(selected))}`;
  };

  return (
    <div className="space-y-5 pb-24">
      <section className="rounded-2xl gradient-curio p-5 text-primary-foreground shadow-lg">
        <p className="text-sm font-medium text-primary-foreground/80">Central operacional</p>
        <h1 className="mt-1 text-2xl font-bold">Nova Ocorrência</h1>
      </section>

      {!isColaborador && (
        <Card className="rounded-2xl border-border bg-card shadow-lg">
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Título *</Label><Input value={form.titulo} maxLength={80} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Resumo curto da ocorrência" /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Descrição * ({form.descricao.length}/500)</Label><Textarea className="min-h-28" maxLength={500} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o ocorrido com objetividade" /></div>
            </div>
            <div className="space-y-2"><Label>Motivos *</Label><div className="flex flex-wrap gap-2">{reasons.map((reason) => <Button key={reason.value} type="button" variant={form.motivos.includes(reason.value) ? "default" : "outline"} className="h-10 rounded-full px-3 text-xs" onClick={() => toggleFormReason(reason.value)}>{reason.label}</Button>)}</div></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label>Setor afetado</Label><Select value={form.setor} onValueChange={(v) => setForm({ ...form, setor: v })}><SelectTrigger><SelectValue placeholder="Selecionar setor" /></SelectTrigger><SelectContent>{sectors.map((sector) => <SelectItem key={sector} value={sector}>{sector}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Unidade</Label><Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })} disabled={!canViewAll}><SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger><SelectContent>{units.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Urgência *</Label><div className="grid grid-cols-3 gap-2">{[{ v: "baixa", l: "🟢 Baixa" }, { v: "media", l: "🟡 Média" }, { v: "alta", l: "🔴 Alta" }].map((item) => <Button key={item.v} type="button" variant={form.urgencia === item.v ? "default" : "outline"} className="min-h-12 rounded-xl" onClick={() => setForm({ ...form, urgencia: item.v })}>{item.l}</Button>)}</div></div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
            <Button variant="outline" className="min-h-12 w-full gap-2 rounded-xl" onClick={() => fileRef.current?.click()} disabled={uploading || photos.length >= 5}><Camera className="h-5 w-5" /> {uploading ? "Enviando..." : `Adicionar fotos (${photos.length}/5)`}</Button>
            {!!photos.length && <div className="flex gap-2 overflow-x-auto pb-1">{photos.map((src) => <div key={src} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border"><img src={src} alt="Foto da ocorrência" className="h-full w-full object-cover" /><button className="absolute right-1 top-1 rounded-full bg-card/90 p-0.5" onClick={() => setPhotos((current) => current.filter((item) => item !== src))}><X className="h-3 w-3" /></button></div>)}</div>}
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Custo estimado</Label><Input type="number" min="0" step="0.01" value={form.custo_estimado} onChange={(e) => setForm({ ...form, custo_estimado: e.target.value })} placeholder="R$ 0,00" /></div><div className="space-y-2"><Label>Prazo desejado</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start rounded-xl text-left font-normal", !form.prazo_desejado && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{form.prazo_desejado ? format(form.prazo_desejado, "dd/MM/yyyy") : "Escolher data"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={form.prazo_desejado} onSelect={(date) => setForm({ ...form, prazo_desejado: date })} initialFocus className="pointer-events-auto p-3" /></PopoverContent></Popover></div></div>
            <div className="space-y-2"><Label>Observação adicional</Label><Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Informações complementares" /></div>
            <Select value={form.atribuido_a} onValueChange={(v) => setForm({ ...form, atribuido_a: v })}><SelectTrigger><SelectValue placeholder="Atribuir a alguém" /></SelectTrigger><SelectContent>{people.map((person) => <SelectItem key={person.user_id} value={person.user_id}>{person.nome}</SelectItem>)}</SelectContent></Select>
            <Button className="min-h-12 w-full gap-2 rounded-xl shadow-lg" onClick={submit}><Send className="h-5 w-5" /> Registrar Ocorrência</Button>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl shadow-lg"><CardContent className="space-y-3 p-4"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="aberto">Abertas</SelectItem><SelectItem value="em_tratamento">Em tratamento</SelectItem><SelectItem value="resolvido">Resolvidas</SelectItem></SelectContent></Select><Select value={urgency} onValueChange={setUrgency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Urgência</SelectItem><SelectItem value="baixa">Baixa</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="alta">Alta</SelectItem></SelectContent></Select><Select value={period} onValueChange={setPeriod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="all">Todas</SelectItem></SelectContent></Select></div><div className="flex gap-2 overflow-x-auto pb-1">{reasons.map((reason) => <Button key={reason.value} variant={reasonFilter.includes(reason.value) ? "default" : "outline"} size="sm" className="shrink-0 rounded-full text-xs" onClick={() => toggleReasonFilter(reason.value)}>{reason.label}</Button>)}</div></CardContent></Card>

      <div className="space-y-3">{visibleItems.map((item) => <Card key={item.id} className={cn("rounded-2xl border-l-4 bg-card shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl", urgencyClass[item.urgencia])} onClick={() => setSelected(item)}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-lg font-bold text-foreground">{item.titulo}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.descricao}</p></div><Badge variant="outline">{statusLabels[item.status] || item.status}</Badge></div><div className="mt-3 flex flex-wrap gap-1.5">{item.motivos.map((motivo) => <Badge key={motivo} className="rounded-full text-[10px]" variant="secondary">{reasons.find((r) => r.value === motivo)?.label || motivo}</Badge>)}</div><div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{item.setor || "Setor não informado"}{item.custo_estimado ? ` • ${money(item.custo_estimado)}` : ""}</span><span>{format(new Date(item.criado_em), "dd/MM/yyyy")}</span></div><div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Por {authorMap.get(item.reportado_por) || "Usuário"}</p>{item.fotos.length > 0 && <div className="flex items-center gap-1 text-xs text-primary"><ImageIcon className="h-4 w-4" /> {item.fotos.length}</div>}</div></CardContent></Card>)}</div>
      {!visibleItems.length && <Card className="rounded-2xl border-dashed"><CardContent className="p-8 text-center"><p className="text-4xl">🐦</p><h2 className="mt-2 font-bold text-foreground">Nenhuma ocorrência encontrada</h2><p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou registre uma nova ocorrência.</p></CardContent></Card>}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl"><DialogHeader><DialogTitle>Detalhe da Ocorrência</DialogTitle></DialogHeader>{selected && <div className="space-y-4"><div><h2 className="text-xl font-bold text-foreground">{selected.titulo}</h2><p className="text-sm text-muted-foreground">{unitMap.get(selected.unit_id)} • {format(new Date(selected.criado_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p></div><p className="text-sm text-foreground">{selected.descricao}</p>{selected.observacao && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{selected.observacao}</p>}<div className="flex flex-wrap gap-2">{selected.motivos.map((motivo) => <Badge key={motivo}>{reasons.find((r) => r.value === motivo)?.label || motivo}</Badge>)}</div><div className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-muted p-3"><b>Urgência</b><p>{selected.urgencia}</p></div><div className="rounded-xl bg-muted p-3"><b>Status</b><p>{statusLabels[selected.status]}</p></div><div className="rounded-xl bg-muted p-3"><b>Setor</b><p>{selected.setor || "-"}</p></div><div className="rounded-xl bg-muted p-3"><b>Custo</b><p>{money(selected.custo_estimado) || "-"}</p></div></div>{selected.fotos.length > 0 && <div className="grid grid-cols-3 gap-2">{selected.fotos.map((src) => <img key={src} src={src} alt="Foto da ocorrência" className="aspect-square rounded-xl object-cover" />)}</div>}<Input placeholder="Adicionar comentário" value={comment} onChange={(e) => setComment(e.target.value)} /><Button variant="outline" className="min-h-12 w-full rounded-xl" onClick={addComment}>Comentar</Button><Button variant="outline" className="min-h-12 w-full gap-2 rounded-xl" onClick={() => setExportOpen(true)}><FileDown className="h-5 w-5" /> Exportar</Button><Button className="min-h-12 w-full gap-2 rounded-xl" onClick={resolve}><CheckCircle2 className="h-5 w-5" /> Marcar como resolvida</Button></div>}</DialogContent></Dialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Exportar ocorrência</DialogTitle></DialogHeader><div className="space-y-3"><Button className="min-h-12 w-full justify-start gap-2 rounded-xl" onClick={exportPdf}><FileDown className="h-5 w-5" /> 📄 Baixar PDF</Button><Button variant="outline" className="min-h-12 w-full justify-start gap-2 rounded-xl" onClick={shareWhatsapp}><Share2 className="h-5 w-5" /> 💬 Compartilhar via WhatsApp</Button><div className="space-y-2 rounded-xl border border-border p-3"><Label>Enviar por email</Label><Input type="email" placeholder="destinatario@email.com" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} /><Button variant="outline" className="min-h-12 w-full gap-2 rounded-xl" onClick={sendEmail}><Mail className="h-5 w-5" /> ✉️ Enviar por email</Button></div></div></DialogContent></Dialog>
    </div>
  );
}
