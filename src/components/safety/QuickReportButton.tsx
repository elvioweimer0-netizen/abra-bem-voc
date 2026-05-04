import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { ReportIncidentDialog } from "./ReportIncidentDialog";

export function QuickReportButton() {
  return (
    <ReportIncidentDialog
      trigger={
        <Button variant="outline" size="sm" className="gap-2">
          <ShieldAlert className="h-4 w-4" /> + Incidente de segurança
        </Button>
      }
    />
  );
}
