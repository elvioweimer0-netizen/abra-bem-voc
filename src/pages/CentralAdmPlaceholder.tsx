import { Briefcase, ExternalLink } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const areas = {
  rh: {
    title: "RH",
    owner: "Gleisiane",
    bullets: ["Cadastro e gestão de colaboradores", "Advertências e suspensões formais", "Gestão de férias", "Treinamentos da rede", "Histórico de avaliações"],
  },
  dp: {
    title: "DP",
    owner: "Ygor",
    bullets: ["Rotinas de Departamento Pessoal", "Documentos admissionais", "Controle de ponto", "Solicitações trabalhistas"],
  },
  financeiro: {
    title: "Financeiro",
    owner: "Regiane",
    bullets: ["Indicadores financeiros", "Contas a pagar e receber", "Solicitações das lojas", "Resumo semanal da rede"],
  },
  ti: {
    title: "TI",
    owner: "Kildery",
    bullets: ["Chamados de suporte", "Equipamentos por unidade", "Acessos e sistemas", "Histórico de atendimento"],
  },
  manutencao: {
    title: "Manutenção",
    owner: "Hilton Junio + Pai do Diretor",
    bullets: ["Abertura de chamados de manutenção", "Ordens de serviço", "Histórico por unidade", "Calendário preventivo"],
  },
  marketing: {
    title: "Marketing",
    owner: "Marketing",
    bullets: ["Campanhas internas", "Materiais por unidade", "Calendário de ações", "Solicitações de comunicação"],
  },
  comercial: {
    title: "Comercial",
    owner: "Comercial",
    bullets: ["Ações comerciais", "Oportunidades por loja", "Demandas de fornecedores", "Acompanhamento de campanhas"],
  },
  administrativo: {
    title: "Administrativo",
    owner: "Administrativo",
    bullets: ["Documentos administrativos", "Solicitações gerais", "Fluxos internos", "Acompanhamento de pendências"],
  },
};

export default function CentralAdmPlaceholder() {
  const { slug = "rh" } = useParams<{ slug: string }>();
  const area = areas[slug as keyof typeof areas] ?? areas.rh;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="rounded-xl bg-card p-5 card-shadow">
        <p className="text-sm font-medium text-muted-foreground">Central ADM</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{area.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Responsável: {area.owner}</p>
      </header>

      <Card className="border-border card-shadow">
        <CardContent className="flex flex-col items-center p-7 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Briefcase className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Área em Construção</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Esta gerência está sendo preparada e funcionalidades específicas estarão disponíveis em breve.
          </p>

          <div className="mt-6 w-full rounded-lg bg-muted/60 p-4 text-left">
            <p className="mb-3 text-sm font-semibold text-foreground">O que vai ter aqui em breve</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {area.bullets.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>

          <Button asChild className="mt-6 w-full sm:w-auto">
            <a href="https://wa.me/5565990000000" target="_blank" rel="noreferrer">
              Falar com {area.owner} no WhatsApp <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">Responsável atual: {area.owner}</p>
    </div>
  );
}