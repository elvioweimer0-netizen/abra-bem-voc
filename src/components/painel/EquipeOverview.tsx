import { forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Cake, Smile, Trophy, AlertTriangle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

type Row = { label: string; value: string; href?: string; icon: any; tone?: "success" | "warning" | "destructive" };

export const EquipeOverview = forwardRef<HTMLDivElement, { rows?: Row[]; title?: string }>(function EquipeOverview({ rows, title = "Equipe" }, ref) {
  const _ref = ref;
  const navigate = useNavigate();
  const list: Row[] = rows ?? [
    { label: "Presença hoje", value: "—", icon: Users, href: "/minha-equipe" },
    { label: "Aniversariante", value: "—", icon: Cake },
    { label: "Humor da equipe (semana)", value: "—", icon: Smile, href: "/clima" },
    { label: "Top 3 da semana", value: "—", icon: Trophy, href: "/reconhecimentos" },
    { label: "Risco de churn", value: "—", icon: AlertTriangle, tone: "warning", href: "/admin/risco-churn" },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ul className="divide-y divide-border">
          {list.map((r) => (
            <li
              key={r.label}
              onClick={() => r.href && navigate(r.href)}
              className={`flex items-center justify-between py-2.5 px-2 rounded-md ${r.href ? "cursor-pointer hover:bg-muted/50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <r.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{r.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.tone === "destructive" ? "destructive" : "secondary"}>{r.value}</Badge>
                {r.href && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
