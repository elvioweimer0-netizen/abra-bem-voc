import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { useIsRhAdmin } from "@/hooks/useIsRhAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { validateRow, type ValidatedRow, type UnitLookup } from "@/lib/import-validators";
import { formatCpf } from "@/lib/cpf";
import { Navigate } from "react-router-dom";

type ImportResult = {
  created: number;
  updated: number;
  failed: number;
  results: Array<{ cpf: string; nome: string; status: string; reason?: string }>;
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

  const { data: units = [] } = useQuery({
    queryKey: ["units-lookup"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("id, name, code").eq("active", true);
      if (error) throw error;
      return (data ?? []) as UnitLookup[];
    },
  });

  const { data: existingCpfs = new Set<string>() } = useQuery({
    queryKey: ["existing-cpfs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("cpf")
        .not("cpf", "is", null);
      if (error) throw error;
      return new Set<string>((data ?? []).map((p: any) => String(p.cpf).replace(/\D/g, "")));
    },
  });

  const counts = useMemo(() => {
    const c = { ok: 0, aviso: 0, erro: 0 };
    rows.forEach((r) => c[r.status]++);
    return c;
  }, [rows]);

  const filtered = useMemo(
    () => (filter === "todos" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

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

      // count duplicates inside file
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
              <div className="flex gap-2 flex-wrap">
                {(["todos", "ok", "aviso", "erro"] as const).map((f) => (
                  <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                    {f}
                  </Button>
                ))}
              </div>
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
                    {filtered.slice(0, 500).map((r) => (
                      <TableRow key={r.index}>
                        <TableCell className="text-xs">{r.index}</TableCell>
                        <TableCell className="font-medium">{r.normalized.nome}</TableCell>
                        <TableCell className="text-xs">{r.normalized.cpf ? formatCpf(r.normalized.cpf) : "—"}</TableCell>
                        <TableCell className="text-xs">{r.normalized.unit_name ?? r.normalized.unidade_input}</TableCell>
                        <TableCell className="text-xs">{r.normalized.cargo ?? "—"}</TableCell>
                        <TableCell className="text-xs">{r.normalized.setor_organograma}</TableCell>
                        <TableCell>
                          <Badge
                            variant={r.status === "ok" ? "default" : r.status === "aviso" ? "secondary" : "destructive"}
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.reasons.join("; ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filtered.length > 500 && (
                  <p className="text-xs text-muted-foreground p-2">Mostrando primeiras 500 linhas.</p>
                )}
              </div>
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
