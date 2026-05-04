import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { SafetyIncident } from "@/hooks/useSafetyIncidents";
import { SEV_LABEL, TYPE_LABEL, STATUS_LABEL } from "./IncidentBadges";

type Props = {
  incidents: SafetyIncident[];
  unitsMap?: Map<string, { code: string; name: string }>;
  scopeLabel?: string;
};

export function ExportNRReportButton({ incidents, unitsMap, scopeLabel }: Props) {
  function handleExport() {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthly = incidents.filter((i) => new Date(i.occurred_at) >= monthAgo);

    const doc = new jsPDF();
    const today = format(new Date(), "dd/MM/yyyy");

    doc.setFontSize(14);
    doc.text("Relatório de Incidentes de Segurança do Trabalho", 14, 18);
    doc.setFontSize(10);
    doc.text(`Período: últimos 30 dias  |  Emitido em: ${today}`, 14, 25);
    if (scopeLabel) doc.text(`Escopo: ${scopeLabel}`, 14, 31);
    doc.text("Compatível com NR-01 / NR-04 / NR-05 (registros internos)", 14, scopeLabel ? 37 : 31);

    const startY = scopeLabel ? 44 : 38;

    autoTable(doc, {
      startY,
      head: [["Data", "Unidade", "Tipo", "Gravidade", "Local", "Descrição", "Ação imediata", "Causa raiz", "Ação corretiva", "Status"]],
      body: monthly.map((i) => [
        format(new Date(i.occurred_at), "dd/MM HH:mm"),
        unitsMap?.get(i.unit_id)?.code ?? "—",
        TYPE_LABEL[i.incident_type],
        SEV_LABEL[i.severity],
        i.location_in_store ?? "—",
        i.description,
        i.action_immediate ?? "—",
        i.root_cause ?? "—",
        i.action_corrective ?? "—",
        STATUS_LABEL[i.status],
      ]),
      styles: { fontSize: 7, cellPadding: 1.5, overflow: "linebreak" },
      headStyles: { fillColor: [120, 30, 30] },
      columnStyles: {
        5: { cellWidth: 35 },
        6: { cellWidth: 22 },
        7: { cellWidth: 22 },
        8: { cellWidth: 22 },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? startY + 20;
    doc.setFontSize(9);
    doc.text(`Total de incidentes: ${monthly.length}`, 14, finalY + 10);
    doc.text("_________________________________________", 14, finalY + 28);
    doc.text("Responsável pela gestão de SST", 14, finalY + 33);

    doc.save(`relatorio-NR-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  return (
    <Button variant="outline" onClick={handleExport} className="gap-2">
      <FileDown className="h-4 w-4" /> Exportar relatório NR
    </Button>
  );
}
