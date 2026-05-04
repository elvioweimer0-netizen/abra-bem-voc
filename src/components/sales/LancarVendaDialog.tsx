import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useCreateSalesMetric, useImportSalesCsv } from "@/hooks/useCreateSalesMetric";

export function LancarVendaDialog({ unitId }: { unitId: string }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hour, setHour] = useState<string>("");
  const [revenue, setRevenue] = useState("");
  const [transactions, setTransactions] = useState("");
  const [csv, setCsv] = useState("");
  const create = useCreateSalesMetric();
  const importCsv = useImportSalesCsv();

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      unit_id: unitId,
      metric_date: date,
      metric_hour: hour === "" ? null : parseInt(hour, 10),
      revenue: Number(revenue.replace(",", ".")),
      transactions: parseInt(transactions || "0", 10),
    });
    setOpen(false);
    setRevenue("");
    setTransactions("");
  };

  const submitCsv = async () => {
    if (!csv.trim()) return;
    await importCsv.mutateAsync({ unit_id: unitId, csv_text: csv });
    setOpen(false);
    setCsv("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Lançar venda</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar vendas</DialogTitle></DialogHeader>
        <Tabs defaultValue="manual">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="csv">CSV do PDV</TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
            <form onSubmit={submitManual} className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div>
                  <Label>Hora (opcional)</Label>
                  <Input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(e.target.value)} placeholder="dia inteiro" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Receita (R$)</Label>
                  <Input value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="0,00" required />
                </div>
                <div>
                  <Label>Transações</Label>
                  <Input type="number" min={0} value={transactions} onChange={(e) => setTransactions(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>Registrar</Button>
            </form>
          </TabsContent>
          <TabsContent value="csv">
            <div className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground">
                Cabeçalho esperado: <code>date,hour,revenue,transactions</code>. Hora opcional.
              </p>
              <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} placeholder={"date,hour,revenue,transactions\n2026-05-04,,12500.50,180"} />
              <Button onClick={submitCsv} className="w-full" disabled={importCsv.isPending || !csv.trim()}>
                Importar CSV
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
