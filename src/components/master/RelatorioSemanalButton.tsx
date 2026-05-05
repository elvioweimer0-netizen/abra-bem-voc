import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function RelatorioSemanalButton() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-master-weekly-pdf", { body: {} });
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("URL não retornada");
      window.open(url, "_blank");
      toast({ title: "Relatório gerado" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar relatório", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Relatório semanal da rede</p>
          <p className="text-xs text-muted-foreground">PDF com KPIs, top movers, ranking e gráficos da semana.</p>
        </div>
        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
          Gerar relatório semanal
        </Button>
      </CardContent>
    </Card>
  );
}
