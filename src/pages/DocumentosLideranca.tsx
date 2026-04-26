import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle, FileText, Search, Send, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const db = supabase as any;

type Template = { id: string; type: string; titulo: string; descricao: string; categoria: string; content_template: string; required_fields: Array<{ name: string; label: string; type: string }>; approval_flow: string[] };
type Member = { id: string; nome: string | null; cargo: string | null; sector?: string | null; unit_id: string | null; foto_url: string | null };
type Doc = { id: string; type: string; colaborador_id: string | null; criado_por: string; dados_jsonb: Record<string, string>; pdf_url: string | null; status: string; motivo_rejeicao: string | null; criado_em: string; finalizado_em: string | null; document_templates?: Template; team_members?: Member };
type Approval = { id: string; document_id: string; role_required: string; status: string; motivo: string | null; documents?: Doc };

const statusLabel: Record<string, string> = { rascunho: "Rascunho", enviado: "Enviado", em_aprovacao: "Em aprovação", aprovado: "Aprovado", rejeitado: "Rejeitado", finalizado: "Finalizado", pendente: "Pendente" };

function isCentralArea(profile: any, area: string) {
  const text = `${profile?.nome ?? ""} ${profile?.cargo_titulo ?? ""} ${profile?.descricao ?? ""}`.toLowerCase();
  return (profile?.cargo === "admin" || profile?.cargo === "master") || (profile?.unidade?.includes("CENTRAL") && (text.includes(area) || (area === "dp" && text.includes("departamento pessoal"))));
}

function renderTemplate(template: Template | null, member: Member | null, fields: Record<string, string>, profile: any) {
  if (!template) return "";
  const values: Record<string, string> = {
    nome: member?.nome || fields.nome || "",
    cargo: fields.cargo || member?.cargo || "",
    setor: fields.setor || member?.sector || "",
    unidade: fields.unidade || profile?.unidade || "",
    data: fields.data || new Date().toLocaleDateString("pt-BR"),
    ...fields,
  };
  return template.content_template.replace(/{{(.*?)}}/g, (_, key) => values[String(key).trim()] || "");
}

function makePdf(title: string, text: string) {
  const clean = `${title}\n\n${text}`.replace(/[()\\]/g, " ").split("\n").flatMap((line) => line.match(/.{1,86}(\s|$)/g) || [line]);
  const lines = clean.slice(0, 45).map((line, index) => `BT /F1 11 Tf 50 ${780 - index * 17} Td (${line.trim()}) Tj ET`).join("\n");
  const stream = `2 J\n${lines}`;
  const pdf = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj\nxref\n0 6\n0000000000 65535 f \ntrailer << /Root 1 0 R /Size 6 >>\nstartxref\n0\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export default function DocumentosLideranca() {
  const { user, profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [mode, setMode] = useState<"list" | "templates" | "form">("list");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({ data: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<Doc | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");

  const isAdmin = ["admin", "master"].includes(profile?.cargo || "");
  const canRH = isCentralArea(profile, "rh");
  const canDP = isCentralArea(profile, "dp");
  const selectedMember = members.find((m) => m.id === selectedMemberId) || null;
  const preview = renderTemplate(selectedTemplate, selectedMember, fields, profile);

  const load = async () => {
    const [{ data: templateData }, { data: memberData }, { data: documentData }, { data: approvalData }] = await Promise.all([
      db.from("document_templates").select("*").eq("active", true).order("categoria").order("titulo"),
      db.from("team_members").select("id, nome, cargo, sector, unit_id, foto_url").eq("status", "ativo").order("nome"),
      db.from("documents").select("*, document_templates(*), team_members(id,nome,cargo,sector,unit_id,foto_url)").order("criado_em", { ascending: false }).limit(200),
      db.from("document_approvals").select("*, documents(*, document_templates(*), team_members(id,nome,cargo,sector,unit_id,foto_url))").order("created_at", { ascending: false }).limit(200),
    ]);
    setTemplates(templateData || []);
    setMembers(memberData || []);
    setDocuments(documentData || []);
    setApprovals(approvalData || []);
  };

  useEffect(() => { if (profile) load(); }, [profile]);

  useEffect(() => {
    const openPdf = async () => {
      if (!detail?.pdf_url) return setPdfUrl("");
      const { data } = await supabase.storage.from("leadership-documents").createSignedUrl(detail.pdf_url, 600);
      setPdfUrl(data?.signedUrl || "");
    };
    openPdf();
  }, [detail]);

  const filteredDocuments = documents.filter((doc) => (statusFilter === "todos" || doc.status === statusFilter) && (typeFilter === "todos" || doc.type === typeFilter));
  const grouped = useMemo(() => templates.reduce<Record<string, Template[]>>((acc, item) => ({ ...acc, [item.categoria]: [...(acc[item.categoria] || []), item] }), {}), [templates]);
  const rhQueue = approvals.filter((a) => a.role_required === "rh" && ["pendente", "aprovado"].includes(a.status));
  const dpQueue = approvals.filter((a) => a.role_required === "dp" && a.status === "pendente" && ["aprovado", "em_aprovacao"].includes(a.documents?.status || ""));

  const startTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setSelectedMemberId("");
    setFields({ data: new Date().toISOString().slice(0, 10) });
    setMode("form");
  };

  const createDocument = async () => {
    if (!user || !selectedTemplate) return;
    setBusy(true);
    try {
      const pdf = makePdf(selectedTemplate.titulo, preview);
      const path = `${user.id}/${Date.now()}-${selectedTemplate.type}.pdf`;
      const { error: uploadError } = await supabase.storage.from("leadership-documents").upload(path, pdf, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw uploadError;
      const flow = selectedTemplate.approval_flow || [];
      const nextStatus = flow.length ? "em_aprovacao" : "finalizado";
      const { data: doc, error } = await db.from("documents").insert({ type: selectedTemplate.type, colaborador_id: selectedMemberId || null, criado_por: user.id, dados_jsonb: { ...fields, texto_final: preview }, pdf_url: path, status: nextStatus, finalizado_em: flow.length ? null : new Date().toISOString() }).select("id").single();
      if (error) throw error;
      if (flow.length) await db.from("document_approvals").insert(flow.map((role: string) => ({ document_id: doc.id, role_required: role, status: "pendente" })));
      await db.from("notification_events").insert({ type: "weekly_report", title: `Novo documento: ${selectedTemplate.titulo}`, body: `${profile?.nome || "Liderança"} enviou um documento para análise.`, payload: { document_id: doc.id, flow } });
      toast.success("Documento gerado e enviado ✅");
      setMode("list");
      await load();
    } catch (error) {
      toast.error("Erro ao gerar documento", { description: error instanceof Error ? error.message : "Tente novamente." });
    } finally {
      setBusy(false);
    }
  };

  const decide = async (approval: Approval, status: "aprovado" | "rejeitado") => {
    if (!user) return;
    await db.from("document_approvals").update({ status, aprovado_por: user.id, motivo: status === "rejeitado" ? rejectReason : null, decidido_em: new Date().toISOString() }).eq("id", approval.id);
    await db.from("documents").update(status === "rejeitado" ? { status: "rejeitado", motivo_rejeicao: rejectReason } : { status: "aprovado" }).eq("id", approval.document_id);
    toast.success(status === "aprovado" ? "Documento aprovado" : "Documento rejeitado");
    setRejectReason("");
    setDetail(null);
    await load();
  };

  const finalize = async (doc: Doc) => {
    await db.from("documents").update({ status: "finalizado", finalizado_em: new Date().toISOString() }).eq("id", doc.id);
    toast.success("Documento arquivado/processado");
    setDetail(null);
    await load();
  };

  if (mode !== "list") return <div className="space-y-4"><Button variant="ghost" className="gap-2" onClick={() => setMode(mode === "form" ? "templates" : "list")}><ArrowLeft className="h-4 w-4" /> Voltar</Button>{mode === "templates" ? <TemplateList grouped={grouped} onPick={startTemplate} /> : <DocumentForm templates={templates} selectedTemplate={selectedTemplate} members={members} selectedMemberId={selectedMemberId} setSelectedMemberId={setSelectedMemberId} fields={fields} setFields={setFields} preview={preview} busy={busy} onSubmit={createDocument} />}</div>;

  return <div className="space-y-5"><section className="rounded-xl bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">Operação</p><div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h1 className="text-2xl font-bold text-foreground">Documentos da Liderança</h1><Button className="min-h-12 gap-2" onClick={() => setMode("templates")}><FileText className="h-5 w-5" /> Novo Documento</Button></div></section><Tabs defaultValue="meus" className="space-y-4"><TabsList className="grid h-auto grid-cols-3 rounded-xl bg-muted p-1"><TabsTrigger value="meus" className="min-h-11">Meus</TabsTrigger><TabsTrigger value="rh" className="min-h-11" disabled={!canRH}>RH</TabsTrigger><TabsTrigger value="dp" className="min-h-11" disabled={!canDP}>DP</TabsTrigger></TabsList><TabsContent value="meus" className="space-y-3"><Filters templates={templates} statusFilter={statusFilter} setStatusFilter={setStatusFilter} typeFilter={typeFilter} setTypeFilter={setTypeFilter} /><DocumentCards docs={filteredDocuments} onDetail={setDetail} /></TabsContent><TabsContent value="rh" className="space-y-3"><ApprovalCards approvals={rhQueue} onDetail={(doc) => setDetail(doc)} /></TabsContent><TabsContent value="dp" className="space-y-3"><ApprovalCards approvals={dpQueue} onDetail={(doc) => setDetail(doc)} /></TabsContent></Tabs><DocumentDetail open={!!detail} doc={detail} pdfUrl={pdfUrl} approval={approvals.find((a) => a.document_id === detail?.id && ((canRH && a.role_required === "rh") || (canDP && a.role_required === "dp") || (isAdmin && a.role_required === "admin")) && a.status === "pendente")} rejectReason={rejectReason} setRejectReason={setRejectReason} onOpenChange={(open) => !open && setDetail(null)} onApprove={decide} onFinalize={finalize} /></div>;
}

function Filters({ templates, statusFilter, setStatusFilter, typeFilter, setTypeFilter }: any) { return <div className="grid gap-2 rounded-xl bg-card p-3 sm:grid-cols-3"><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent>{["todos", "em_aprovacao", "aprovado", "rejeitado", "finalizado"].map((s) => <SelectItem key={s} value={s}>{statusLabel[s] || "Todos"}</SelectItem>)}</SelectContent></Select><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os tipos</SelectItem>{templates.map((t: Template) => <SelectItem key={t.type} value={t.type}>{t.titulo}</SelectItem>)}</SelectContent></Select><div className="flex items-center gap-2 rounded-lg border border-input px-3 text-muted-foreground"><Search className="h-4 w-4" /><span className="text-sm">Filtros ativos</span></div></div>; }
function TemplateList({ grouped, onPick }: any) { return <div className="space-y-4">{Object.entries(grouped).map(([category, list]: any) => <Card key={category}><CardHeader><CardTitle>{category}</CardTitle></CardHeader><CardContent className="space-y-2">{list.map((template: Template) => <button key={template.id} className="w-full rounded-lg border border-border p-3 text-left" onClick={() => onPick(template)}><p className="font-semibold text-foreground">{template.titulo}</p><p className="text-sm text-muted-foreground">{template.descricao}</p></button>)}</CardContent></Card>)}</div>; }
function DocumentForm({ selectedTemplate, members, selectedMemberId, setSelectedMemberId, fields, setFields, preview, busy, onSubmit }: any) { return <Card><CardHeader><CardTitle>{selectedTemplate?.titulo}</CardTitle></CardHeader><CardContent className="space-y-4"><Select value={selectedMemberId} onValueChange={setSelectedMemberId}><SelectTrigger><SelectValue placeholder="Selecionar colaborador" /></SelectTrigger><SelectContent>{members.map((m: Member) => <SelectItem key={m.id} value={m.id}>{m.nome} · {m.cargo}</SelectItem>)}</SelectContent></Select>{(selectedTemplate?.required_fields || []).map((field: any) => field.type === "textarea" ? <Textarea key={field.name} placeholder={field.label} value={fields[field.name] || ""} onChange={(e) => setFields({ ...fields, [field.name]: e.target.value })} /> : <Input key={field.name} type={field.type === "date" ? "date" : "text"} placeholder={field.label} value={fields[field.name] || ""} onChange={(e) => setFields({ ...fields, [field.name]: e.target.value })} />)}<div className="rounded-xl bg-muted p-4"><p className="mb-2 text-sm font-semibold text-foreground">Preview</p><p className="whitespace-pre-wrap text-sm text-muted-foreground">{preview}</p></div><Button className="min-h-12 w-full gap-2" disabled={busy} onClick={onSubmit}><Send className="h-5 w-5" /> {busy ? "Enviando..." : "Gerar PDF e enviar"}</Button></CardContent></Card>; }
function DocumentCards({ docs, onDetail }: { docs: Doc[]; onDetail: (doc: Doc) => void }) { return <div className="space-y-3">{docs.map((doc) => <Card key={doc.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-foreground">{doc.document_templates?.titulo || doc.type}</p><p className="text-sm text-muted-foreground">{doc.team_members?.nome || "Sem colaborador"} · {new Date(doc.criado_em).toLocaleDateString("pt-BR")}</p></div><Badge>{statusLabel[doc.status] || doc.status}</Badge></div><Button variant="outline" className="mt-3 min-h-11 w-full" onClick={() => onDetail(doc)}>Ver detalhes</Button></CardContent></Card>)}{!docs.length && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhum documento encontrado.</CardContent></Card>}</div>; }
function ApprovalCards({ approvals, onDetail }: { approvals: Approval[]; onDetail: (doc: Doc) => void }) { return <div className="space-y-3">{approvals.map((a) => a.documents && <Card key={a.id}><CardContent className="p-4"><p className="font-bold text-foreground">{a.documents.document_templates?.titulo || a.documents.type}</p><p className="text-sm text-muted-foreground">{a.documents.team_members?.nome || "Sem colaborador"} · {a.role_required.toUpperCase()}</p><Button className="mt-3 min-h-11 w-full" onClick={() => onDetail(a.documents!)}>Abrir decisão</Button></CardContent></Card>)}{!approvals.length && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Sem documentos pendentes.</CardContent></Card>}</div>; }
function DocumentDetail({ open, doc, pdfUrl, approval, rejectReason, setRejectReason, onOpenChange, onApprove, onFinalize }: any) { return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>{doc?.document_templates?.titulo || doc?.type}</DialogTitle></DialogHeader>{doc && <div className="space-y-3"><Badge>{statusLabel[doc.status] || doc.status}</Badge>{pdfUrl ? <iframe src={pdfUrl} title="PDF" className="h-80 w-full rounded-lg border border-border" /> : <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">PDF indisponível.</div>}<p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm text-muted-foreground">{doc.dados_jsonb?.texto_final}</p>{approval && <><Textarea placeholder="Motivo da rejeição" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /><div className="grid gap-2 sm:grid-cols-2"><Button className="gap-2" onClick={() => onApprove(approval, "aprovado")}><CheckCircle className="h-4 w-4" /> Aprovar</Button><Button variant="destructive" className="gap-2" onClick={() => onApprove(approval, "rejeitado")}><XCircle className="h-4 w-4" /> Rejeitar</Button></div></>}{!approval && doc.status !== "finalizado" && <Button className="min-h-11 w-full" onClick={() => onFinalize(doc)}>Registrar e arquivar / processado</Button>}</div>}</DialogContent></Dialog>; }