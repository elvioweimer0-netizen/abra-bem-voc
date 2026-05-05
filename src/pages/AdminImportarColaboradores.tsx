import { useMemo, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Download, Loader2, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { useIsRhAdmin } from "@/hooks/useIsRhAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { validateRow, type ValidatedRow, type UnitLookup, type UnitKind } from "@/lib/import-validators";
import { formatCpf } from "@/lib/cpf";

type ImportResult = {
  created: number;
  updated: number;
  failed: number;
  results: Array<{ cpf: string; nome: string; status: string; reason?: string }>;
};

type SectorTemplate = {
  unit_kind: UnitKind;
  sector_name: string;
  ordem: number;
};

export default function AdminImportarColaboradores() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isMaster, isAdmin, isGerenteAdm } = useRole();
  const isRh = useIsRhAdmin();
  const allowed = isMaster || isAdmin || (isGerenteAdm && isRh);

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [filter, setFilter] = useState<"todos" | "ok" | "aviso" | "erro">("todos");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [view, setView] = useState<"tabela" | "preview">("tabela");

  const { data: units = [] } = useQuery({
    queryKey: ["units-lookup-kind"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("units").select("id, name, code, unit_kind").eq("active", true);
      if (error) throw error;
      return (data ?? []) as UnitLookup[];
    },
  });

  const { data: existingCpfs = new Set<string>() } = useQuery({
    queryKey: ["existing-cpfs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles").select("cpf").not("cpf", "is", null);
      if (error) throw error;
      return new Set<string>((data ?? []).map((p: any) => String(p.cpf).replace(/\D/g, "")));
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["all-sector-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("unit_sector_templates")
        .select("unit_kind, sector_name, ordem")
        .eq("active", true)
        .is("unit_id", null)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as SectorTemplate[];
    },
  });

  const sectorsByKind = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const t of templates) {
      const list = m.get(t.unit_kind) ?? [];
      list.push(t.sector_name);
      m.set(t.unit_kind, list);
    }
    return m;
  }, [templates]);

  const counts = useMemo(() => {
    const c = { ok: 0, aviso: 0, erro: 0 };
    rows.forEach((r) => c[r.status]++);
    return c;
  }, [rows]);

  const filtered = useMemo(
    () => (filter === "todos" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  const groupedByUnit = useMemo(() => {
    const m = new Map<string, { unit_id: string | null; unit_name: string; unit_kind: UnitKind | null; rows: ValidatedRow[] }>();
    rows.forEach((r) => {
      const key = r.normalized.unit_id ?? `__${r.normalized.unidade_input}__`;
      const cur = m.get(key) ?? {
        unit_id: r.normalized.unit_id,
        unit_name: r.normalized.unit_name ?? r.normalized.unidade_input ?? "Sem unidade",
        unit_kind: r.normalized.unit_kind,
        rows: [],
      };
      cur.rows.push(r);
      m.set(key, cur);
    });
    return Array.from(m.values()).sort((a, b) => a.unit_name.localeCompare(b.unit_name));
  }, [rows]);

  const handleFile = useCallback(
    async (f: File) => {
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) {
        toast({ title: "Arquivo grande demais", description: "Máximo 5MB", variant: "destructive" });
        return;
      }
      setFile(f);
      setResult(null);

      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

      const cpfMap = new Map<string, number>();
      json.forEach((r) => {
        const c = String((r as any).CPF ?? (r as any).cpf ?? "").replace(/\D/g, "");
        if (c) cpfMap.set(c, (cpfMap.get(c) ?? 0) + 1);
      });

      const validated = json.map((row, i) => validateRow(row, i + 2, units, existingCpfs as Set<string>, cpfMap));
      setRows(validated);
    },
    [units, existingCpfs, toast],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const updateRowSetor = (idx: number, newSetor: string) => {
    setRows((rs) => rs.map((r) => r.index === idx ? { ...r, normalized: { ...r.normalized, setor_organograma: newSetor } } : r));
  };

  const submit = async () => {
    const toSend = rows.filter((r) => r.status !== "erro");
    if (!toSend.length) {
      toast({ title: "Nenhuma linha válida para importar", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("bulk-import-colaboradores", {
        body: {
          file_name: file?.name ?? "import.xlsx",
          rows: toSend.map((r) => r.normalized),
        },
      });
      if (error) throw error;
      setResult(data as ImportResult);
      toast({ title: "Importação concluída" });
    } catch (e: any) {
      toast({ title: "Erro na importação", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadLog = () => {
    if (!result) return;
    const csv = [
      "cpf,nome,status,motivo",
      ...result.results.map(
        (r) => `${r.cpf},"${r.nome.replace(/"/g, '""')}",${r.status},"${(r.reason ?? "").replace(/"/g, '""')}"`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!allowed) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Importar Colaboradores em Massa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Faça upload do arquivo Excel com a lista de colaboradores. O sistema vai validar, mostrar preview e você confirma antes de criar.
        </p>
      </div>

      {!result && (
        <Card>
          <CardContent
            className="p-8"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:bg-muted/30 transition-colors">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">.xlsx ou .csv · até 5MB</p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
            {file && (
              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!result && rows.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" /> {counts.ok} OK
                </span>
                <span className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" /> {counts.aviso} avisos
                </span>
                <span className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" /> {counts.erro} erros
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap items-center">
                <div className="flex gap-1">
                  <Button variant={view === "tabela" ? "default" : "outline"} size="sm" onClick={() => setView("tabela")}>Tabela</Button>
                  <Button variant={view === "preview" ? "default" : "outline"} size="sm" onClick={() => setView("preview")}>
                    <Building2 className="h-4 w-4 mr-1" />Preview por unidade
                  </Button>
                </div>
                {view === "tabela" && (
                  <div className="flex gap-2 ml-2">
                    {(["todos", "ok", "aviso", "erro"] as const).map((f) => (
                      <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                        {f}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {view === "tabela" && (
                <div className="rounded-lg border max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Linha</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.slice(0, 500).map((r) => {
                        const opts = r.normalized.unit_kind ? sectorsByKind.get(r.normalized.unit_kind) ?? [] : [];
                        return (
                          <TableRow key={r.index}>
                            <TableCell className="text-xs">{r.index}</TableCell>
                            <TableCell className="font-medium">{r.normalized.nome}</TableCell>
                            <TableCell className="text-xs">{r.normalized.cpf ? formatCpf(r.normalized.cpf) : "—"}</TableCell>
                            <TableCell className="text-xs">{r.normalized.unit_name ?? r.normalized.unidade_input}</TableCell>
                            <TableCell className="text-xs">{r.normalized.cargo ?? "—"}</TableCell>
                            <TableCell className="text-xs min-w-[170px]">
                              {opts.length > 0 && r.normalized.posicao_organograma !== "gerente_unidade" ? (
                                <Select
                                  value={r.normalized.setor_organograma || "__none__"}
                                  onValueChange={(v) => updateRowSetor(r.index, v === "__none__" ? "" : v)}
                                >
                                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">— sem setor —</SelectItem>
                                    {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              ) : (
                                r.normalized.setor_organograma || "—"
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.status === "ok" ? "default" : r.status === "aviso" ? "secondary" : "destructive"}>
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.reasons.join("; ")}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {filtered.length > 500 && <p className="text-xs text-muted-foreground p-2">Mostrando primeiras 500 linhas.</p>}
                </div>
              )}

              {view === "preview" && (
                <div className="space-y-4">
                  {groupedByUnit.map((g) => {
                    const sectors = g.unit_kind ? sectorsByKind.get(g.unit_kind) ?? [] : [];
                    const gerente = g.rows.find((r) => r.normalized.posicao_organograma === "gerente_unidade");
                    const encarregados = g.rows.filter((r) => r.normalized.posicao_organograma === "encarregado");
                    const colabs = g.rows.filter((r) => r.normalized.posicao_organograma === "colaborador");
                    return (
                      <div key={g.unit_name} className="rounded-lg border bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold">{g.unit_name}</h3>
                          <Badge variant="outline" className="text-[10px]">{g.unit_kind ?? "?"}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">{g.rows.length} pessoas</span>
                        </div>
                        <div className="text-xs">
                          <div className="rounded-md bg-primary/5 p-2 mb-2">
                            <span className="font-medium">Gerente: </span>
                            {gerente ? gerente.normalized.nome : <span className="text-muted-foreground italic">— vazio —</span>}
                          </div>
                          {(sectors.length ? sectors : ["Outros"]).map((sec) => {
                            const enc = encarregados.filter((e) => (e.normalized.setor_organograma || "").toLowerCase() === sec.toLowerCase());
                            const col = colabs.filter((c) => (c.normalized.setor_organograma || "").toLowerCase() === sec.toLowerCase());
                            const isEmpty = enc.length === 0 && col.length === 0;
                            return (
                              <div key={sec} className="border-l-2 border-border pl-3 py-1 mb-2">
                                <p className="font-medium text-xs">{sec} {isEmpty && <span className="text-muted-foreground italic ml-1">(setor vazio)</span>}</p>
                                {enc.map((e) => (
                                  <p key={e.index} className="text-xs text-foreground">↳ <span className="font-medium">Encarregado:</span> {e.normalized.nome}</p>
                                ))}
                                {col.length > 0 && (
                                  <p className="text-xs text-muted-foreground">↳ {col.length} colaborador(es): {col.slice(0, 3).map((c) => c.normalized.nome).join(", ")}{col.length > 3 ? ` e +${col.length - 3}` : ""}</p>
                                )}
                              </div>
                            );
                          })}
                          {(() => {
                            const orphans = colabs.filter((c) => !sectors.some((s) => s.toLowerCase() === (c.normalized.setor_organograma || "").toLowerCase()));
                            return orphans.length > 0 ? (
                              <div className="border-l-2 border-amber-500 pl-3 py-1">
                                <p className="font-medium text-amber-700">⚠ Sem setor mapeado ({orphans.length})</p>
                                <p className="text-xs text-muted-foreground">{orphans.slice(0, 5).map((c) => c.normalized.nome).join(", ")}</p>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting || counts.ok + counts.aviso === 0}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Importação ({counts.ok + counts.aviso})
            </Button>
            <Button variant="outline" onClick={() => { setRows([]); setFile(null); }}>Cancelar</Button>
          </div>
        </>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Importação concluída</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{result.created}</p>
                <p className="text-xs text-muted-foreground">Criados</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-xs text-muted-foreground">Atualizados</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{result.failed}</p>
                <p className="text-xs text-muted-foreground">Falharam</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => navigate("/admin/colaboradores")}>Ver colaboradores</Button>
              <Button variant="outline" onClick={downloadLog}>
                <Download className="h-4 w-4" /> Baixar log
              </Button>
              <Button variant="ghost" onClick={() => { setResult(null); setRows([]); setFile(null); }}>
                Nova importação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
