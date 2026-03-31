import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Megaphone, FileText, BarChart3, ArrowRight,
  Users, Wrench, TrendingUp, ShoppingCart, DollarSign, Monitor,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GerenciaConfig {
  titulo: string;
  descricao: string;
  icon: React.ComponentType<{ className?: string }>;
  cor: string;
  comunicados: { titulo: string; data: string; urgente?: boolean }[];
  documentos: { titulo: string; tipo: string }[];
  indicadores: { label: string; valor: string; variacao?: string }[];
  atalhos: { label: string; href: string }[];
}

const gerencias: Record<string, GerenciaConfig> = {
  operacao: {
    titulo: "Operação",
    descricao: "Gestão operacional das lojas, incluindo logística, estoque, recebimento e processos de loja. Responsável por garantir o funcionamento diário das unidades.",
    icon: Monitor,
    cor: "text-blue-600",
    comunicados: [
      { titulo: "Nova escala de recebimento - Julho", data: "28/03/2026" },
      { titulo: "Procedimento atualizado para quebras", data: "25/03/2026", urgente: true },
      { titulo: "Reunião de alinhamento semanal", data: "24/03/2026" },
    ],
    documentos: [
      { titulo: "Manual de Operações", tipo: "PDF" },
      { titulo: "Checklist de Abertura/Fechamento", tipo: "PDF" },
      { titulo: "Procedimento de Inventário", tipo: "DOC" },
    ],
    indicadores: [
      { label: "Quebra Operacional", valor: "1.2%", variacao: "-0.3%" },
      { label: "Ruptura de Gôndola", valor: "4.5%", variacao: "-1.1%" },
      { label: "Produtividade", valor: "92%", variacao: "+2%" },
    ],
    atalhos: [
      { label: "Colaboradores", href: "/colaboradores" },
      { label: "Departamentos", href: "/departamentos" },
      { label: "Reuniões", href: "/reunioes" },
    ],
  },
  rh: {
    titulo: "Recursos Humanos",
    descricao: "Gestão de pessoas, recrutamento, treinamento, benefícios e desenvolvimento organizacional. Responsável pelo capital humano da empresa.",
    icon: Users,
    cor: "text-green-600",
    comunicados: [
      { titulo: "Campanha de Aniversariantes - Abril", data: "30/03/2026" },
      { titulo: "Novo plano de benefícios", data: "27/03/2026", urgente: true },
      { titulo: "Calendário de treinamentos Q2", data: "22/03/2026" },
    ],
    documentos: [
      { titulo: "Código de Ética", tipo: "PDF" },
      { titulo: "Políticas Internas", tipo: "PDF" },
      { titulo: "Manual do Colaborador", tipo: "DOC" },
    ],
    indicadores: [
      { label: "Turnover", valor: "3.8%", variacao: "-0.5%" },
      { label: "Absenteísmo", valor: "2.1%", variacao: "-0.2%" },
      { label: "Satisfação", valor: "87%", variacao: "+3%" },
    ],
    atalhos: [
      { label: "Advertências", href: "/advertencias" },
      { label: "Suspensões", href: "/suspensoes" },
      { label: "Código de Ética", href: "/rh/codigo-etica" },
    ],
  },
  marketing: {
    titulo: "Marketing",
    descricao: "Comunicação interna e externa, campanhas promocionais, endomarketing e gestão da marca Curió. Responsável pela imagem e engajamento.",
    icon: TrendingUp,
    cor: "text-purple-600",
    comunicados: [
      { titulo: "Campanha Páscoa 2026 - Briefing", data: "29/03/2026" },
      { titulo: "Novo layout de encartes", data: "26/03/2026" },
      { titulo: "Ação de Endomarketing - Abril", data: "23/03/2026", urgente: true },
    ],
    documentos: [
      { titulo: "Manual de Marca Curió", tipo: "PDF" },
      { titulo: "Calendário Promocional 2026", tipo: "XLS" },
      { titulo: "Guia de Redes Sociais", tipo: "PDF" },
    ],
    indicadores: [
      { label: "Engajamento Interno", valor: "78%", variacao: "+5%" },
      { label: "Alcance Campanhas", valor: "12.4k", variacao: "+800" },
      { label: "NPS Interno", valor: "72", variacao: "+4" },
    ],
    atalhos: [
      { label: "Notícias", href: "/noticias" },
      { label: "Campanhas Internas", href: "/endomarketing" },
      { label: "Galeria", href: "/galeria" },
    ],
  },
  manutencao: {
    titulo: "Manutenção",
    descricao: "Gestão de manutenção predial, equipamentos e infraestrutura das unidades. Responsável pela conservação e funcionamento dos ativos físicos.",
    icon: Wrench,
    cor: "text-orange-600",
    comunicados: [
      { titulo: "Cronograma de manutenção preventiva - Abril", data: "30/03/2026" },
      { titulo: "Troca de compressores - CPA", data: "28/03/2026", urgente: true },
      { titulo: "Vistoria elétrica programada", data: "25/03/2026" },
    ],
    documentos: [
      { titulo: "Plano de Manutenção Preventiva", tipo: "PDF" },
      { titulo: "Checklist de Equipamentos", tipo: "PDF" },
      { titulo: "Procedimento de Chamados", tipo: "DOC" },
    ],
    indicadores: [
      { label: "Chamados Abertos", valor: "14", variacao: "-3" },
      { label: "Tempo Médio Reparo", valor: "4.2h", variacao: "-0.8h" },
      { label: "Preventivas em Dia", valor: "91%", variacao: "+4%" },
    ],
    atalhos: [
      { label: "Departamentos", href: "/departamentos" },
      { label: "Reuniões", href: "/reunioes" },
      { label: "Relatórios", href: "/relatorios" },
    ],
  },
  administrativo: {
    titulo: "Administrativo",
    descricao: "Gestão financeira, contábil e administrativa. Responsável pelo controle orçamentário, contas a pagar/receber e processos administrativos gerais.",
    icon: DollarSign,
    cor: "text-emerald-600",
    comunicados: [
      { titulo: "Fechamento fiscal - Março", data: "31/03/2026", urgente: true },
      { titulo: "Novo processo de reembolso", data: "27/03/2026" },
      { titulo: "Atualização de centros de custo", data: "24/03/2026" },
    ],
    documentos: [
      { titulo: "Política de Reembolso", tipo: "PDF" },
      { titulo: "Manual de Processos Administrativos", tipo: "PDF" },
      { titulo: "Tabela de Centros de Custo", tipo: "XLS" },
    ],
    indicadores: [
      { label: "Contas em Dia", valor: "98%", variacao: "+1%" },
      { label: "Economia Mensal", valor: "R$ 12k", variacao: "+R$ 2k" },
      { label: "Processos Pendentes", valor: "7", variacao: "-2" },
    ],
    atalhos: [
      { label: "Relatórios", href: "/relatorios" },
      { label: "Reuniões", href: "/reunioes" },
      { label: "Políticas Internas", href: "/rh/politicas" },
    ],
  },
  comercial: {
    titulo: "Comercial",
    descricao: "Gestão de compras, negociações com fornecedores, precificação e mix de produtos. Responsável pela estratégia comercial e competitividade.",
    icon: ShoppingCart,
    cor: "text-red-600",
    comunicados: [
      { titulo: "Novo contrato - Fornecedor X", data: "29/03/2026" },
      { titulo: "Revisão de margens - Hortifruti", data: "26/03/2026", urgente: true },
      { titulo: "Tabloide Semanal - Abril/S1", data: "25/03/2026" },
    ],
    documentos: [
      { titulo: "Política de Compras", tipo: "PDF" },
      { titulo: "Tabela de Fornecedores Homologados", tipo: "XLS" },
      { titulo: "Manual de Precificação", tipo: "PDF" },
    ],
    indicadores: [
      { label: "Margem Média", valor: "28.5%", variacao: "+0.8%" },
      { label: "Saving Compras", valor: "R$ 45k", variacao: "+R$ 8k" },
      { label: "Fornecedores Ativos", valor: "142", variacao: "+5" },
    ],
    atalhos: [
      { label: "Departamentos", href: "/departamentos" },
      { label: "Relatórios", href: "/relatorios" },
      { label: "Reuniões", href: "/reunioes" },
    ],
  },
};

export default function GerenciaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const config = slug ? gerencias[slug] : null;

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground">Gerência não encontrada</h1>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-card shadow-sm ${config.cor}`}>
          <Icon className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{config.titulo}</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">{config.descricao}</p>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {config.indicadores.map((ind) => (
          <Card key={ind.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{ind.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-foreground">{ind.valor}</span>
                {ind.variacao && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    {ind.variacao}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comunicados */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Comunicados
            </CardTitle>
            <CardDescription>Últimos comunicados da gerência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.comunicados.map((c) => (
              <div key={c.titulo} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.data}</p>
                </div>
                {c.urgente && (
                  <Badge variant="destructive" className="text-[10px] shrink-0">Urgente</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentos
            </CardTitle>
            <CardDescription>Documentos relacionados à área</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.documentos.map((d) => (
              <div key={d.titulo} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{d.titulo}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">{d.tipo}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Atalhos */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Atalhos Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {config.atalhos.map((a) => (
              <Button
                key={a.label}
                variant="outline"
                className="gap-2"
                onClick={() => navigate(a.href)}
              >
                {a.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
