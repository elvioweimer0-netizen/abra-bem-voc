import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, ClipboardList, Shield, Scale, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const policies = [
  {
    title: "Código de Ética e Procedimentos",
    description: "Valores, normas de conduta, direitos, deveres e penalidades do Curió Supermercado.",
    icon: <BookOpen className="h-6 w-6" />,
    href: "/rh/codigo-etica",
    tags: ["Ética", "Conduta", "Valores"],
  },
  {
    title: "Cartilha Operacional — Frente de Caixa",
    description: "Guia completo de procedimentos, atendimento ao cliente, operação de caixa e segurança.",
    icon: <ClipboardList className="h-6 w-6" />,
    href: "/rh/cartilha",
    tags: ["Operação", "Caixa", "Atendimento"],
  },
  {
    title: "Política de Segurança",
    description: "Normas de segurança patrimonial, prevenção de perdas e procedimentos de emergência.",
    icon: <Shield className="h-6 w-6" />,
    href: "/rh/codigo-etica#seguranca",
    tags: ["Segurança", "Prevenção"],
  },
  {
    title: "Direitos e Deveres",
    description: "Informações sobre direitos trabalhistas, deveres do colaborador e responsabilidades.",
    icon: <Scale className="h-6 w-6" />,
    href: "/rh/codigo-etica#direitos-deveres",
    tags: ["RH", "Direitos"],
  },
  {
    title: "Liderança e Gestão",
    description: "Guia para líderes e gestores sobre como conduzir equipes com excelência.",
    icon: <Users className="h-6 w-6" />,
    href: "/rh/cartilha#lideranca",
    tags: ["Liderança", "Gestão"],
  },
];

export default function PoliticasInternas() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Políticas Internas
        </h1>
        <p className="text-muted-foreground">
          Documentos oficiais, normas e diretrizes do Curió Supermercado
        </p>
      </div>

      <div className="grid gap-4">
        {policies.map((policy) => (
          <Card
            key={policy.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(policy.href)}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {policy.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{policy.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{policy.description}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {policy.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
