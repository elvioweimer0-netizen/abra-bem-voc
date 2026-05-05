import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, ClipboardList, MessageSquareWarning, ShieldAlert, PackageX, HelpCircle, ChevronRight } from "lucide-react";

type Item = { label: string; count: number; href: string; icon: any; tone?: "warning" | "destructive" | "muted" };

export function PendenciasMinhas({ items }: { items?: Item[] }) {
  const navigate = useNavigate();
  const list: Item[] = items ?? [
    { label: "Checklist do dia", count: 0, href: "/checklist-diario", icon: ClipboardCheck },
    { label: "Auditoria visual", count: 0, href: "/auditoria-visual", icon: ClipboardList },
    { label: "Reclamações abertas", count: 0, href: "/reclamacoes", icon: MessageSquareWarning, tone: "warning" },
    { label: "Incidentes em investigação", count: 0, href: "/seguranca", icon: ShieldAlert, tone: "destructive" },
    { label: "Produtos faltando hoje", count: 0, href: "/produtos-faltando", icon: PackageX },
    { label: "Pergunta da semana", count: 0, href: "/pergunta-da-semana", icon: HelpCircle },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Minhas pendências</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ul className="divide-y divide-border">
          {list.map((it) => (
            <li
              key={it.label}
              onClick={() => navigate(it.href)}
              className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/50 rounded-md cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <it.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{it.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {it.count > 0 && (
                  <Badge variant={it.tone === "destructive" ? "destructive" : "secondary"}>{it.count}</Badge>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
