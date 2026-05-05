import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, PackageX, ShieldAlert, Repeat, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AreaOperacional() {
  const navigate = useNavigate();
  const items = [
    { label: "Auditoria visual da minha área", href: "/auditoria-visual", icon: ClipboardList },
    { label: "Ruptura na minha área", href: "/produtos-faltando", icon: PackageX },
    { label: "Incidentes da área (30d)", href: "/seguranca", icon: ShieldAlert },
    { label: "Reposição em trânsito", href: "/reposicao", icon: Repeat },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Área operacional</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li
              key={i.label}
              onClick={() => navigate(i.href)}
              className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/50 rounded-md cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <i.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{i.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
