import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HuddleStatusBadge } from "./HuddleStatusBadge";
import type { HuddleReport } from "@/hooks/useDailyHuddle";

type Props = {
  unitName: string;
  report?: HuddleReport;
  isToday: boolean;
  onClick?: () => void;
};

const fmtBRL = (v?: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function HuddlePanelCard({ unitName, report, isToday, onClick }: Props) {
  const filled = !!report;
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition hover:shadow-md ${filled ? "border-success/40" : isToday ? "border-warning/50 animate-pulse" : "border-border"}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{unitName}</CardTitle>
          {filled ? (
            <Badge variant="outline" className="bg-success/15 text-success border-success/40">Preenchido</Badge>
          ) : (
            <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/40">Pendente</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Venda ontem</span>
          <span className="font-medium">{fmtBRL(report?.venda_dia_anterior)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Meta</span>
          {report ? <HuddleStatusBadge status={report.meta_status} /> : <span className="text-muted-foreground">—</span>}
        </div>
        {report?.bo_dia && (
          <p className="line-clamp-2 text-xs text-muted-foreground border-t pt-2">{report.bo_dia}</p>
        )}
      </CardContent>
    </Card>
  );
}
