import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Target, History, Eye, Heart, Shield, Scale, AlertTriangle, Lock } from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const sections: Section[] = [
  {
    id: "apresentacao",
    title: "Apresentação",
    icon: <BookOpen className="h-5 w-5" />,
    content: [
      "Bem-vindo ao Código de Ética e Procedimentos dos Supermercados Curió.",
      "Este documento representa os valores, princípios e normas que guiam nosso trabalho diário. Cada colaborador é parte fundamental da construção de um ambiente de trabalho saudável, respeitoso e produtivo.",
      "O Curió Supermercado acredita que o sucesso da empresa está diretamente ligado ao comprometimento e à postura ética de cada membro da equipe.",
      "Leia com atenção, tire suas dúvidas e pratique esses valores no dia a dia."
    ]
  },
  {
    id: "objetivos",
    title: "Objetivos",
    icon: <Target className="h-5 w-5" />,
    content: [
      "Estabelecer padrões claros de conduta e comportamento para todos os colaboradores.",
      "Promover um ambiente de trabalho justo, seguro e acolhedor.",
      "Orientar sobre direitos, deveres e responsabilidades dentro da empresa.",
      "Garantir a excelência no atendimento ao cliente.",
      "Fortalecer a cultura organizacional do Curió Supermercado.",
      "Prevenir conflitos e assegurar o cumprimento das normas internas."
    ]
  },
  {
    id: "historia",
    title: "Nossa História",
    icon: <History className="h-5 w-5" />,
    content: [
      "O Supermercados Curió nasceu do sonho de oferecer produtos de qualidade com atendimento humano e próximo à comunidade.",
      "Ao longo dos anos, nos expandimos para múltiplas unidades — Cidade Alta, Goiabeiras, Jardim Cuiabá, CPA, Central de Produção e Centro de Distribuição — sempre mantendo nossos valores de origem.",
      "Cada unidade carrega a essência Curió: atendimento que encanta, equipe que faz a diferença e compromisso com a comunidade.",
      "Hoje somos referência em varejo na região, e isso se deve ao trabalho dedicado de cada colaborador."
    ]
  },
  {
    id: "missao-visao-valores",
    title: "Missão, Visão e Valores",
    icon: <Eye className="h-5 w-5" />,
    content: [
      "🎯 MISSÃO: Oferecer produtos de qualidade com o melhor atendimento, proporcionando uma experiência de compra acolhedora e eficiente para nossos clientes.",
      "🔭 VISÃO: Ser reconhecido como o supermercado mais querido da região, referência em atendimento, qualidade e compromisso com a comunidade.",
      "💎 VALORES:",
      "• Respeito — tratamos todos com dignidade e consideração.",
      "• Ética — agimos com transparência e honestidade em todas as relações.",
      "• Trabalho em equipe — juntos somos mais fortes e alcançamos melhores resultados.",
      "• Excelência — buscamos a melhoria contínua em tudo o que fazemos.",
      "• Acolhimento — cada cliente e colaborador é importante para nós.",
      "• Comprometimento — vestimos a camisa e damos o nosso melhor todos os dias."
    ]
  },
  {
    id: "conduta",
    title: "Conduta e Comportamento",
    icon: <Heart className="h-5 w-5" />,
    content: [
      "Todo colaborador deve manter postura profissional, respeitosa e ética dentro e fora do ambiente de trabalho.",
      "📌 Regras de conduta:",
      "• Tratar colegas, clientes e fornecedores com respeito e cordialidade.",
      "• Manter a pontualidade e a assiduidade.",
      "• Usar o uniforme completo e limpo durante o expediente.",
      "• Não utilizar celular durante o atendimento ao cliente.",
      "• Não mascar chicletes, comer ou beber no salão de vendas.",
      "• Não fazer brincadeiras, piadas ou conversas paralelas durante o trabalho.",
      "• Manter o sigilo sobre informações internas da empresa.",
      "• Não fazer uso de substâncias proibidas no ambiente de trabalho.",
      "• Comunicar à liderança qualquer irregularidade ou situação de risco.",
      "• Zelar pelo patrimônio da empresa, incluindo equipamentos e instalações."
    ]
  },
  {
    id: "direitos-deveres",
    title: "Direitos e Deveres",
    icon: <Scale className="h-5 w-5" />,
    content: [
      "✅ DIREITOS DO COLABORADOR:",
      "• Receber remuneração justa e pontual.",
      "• Ter acesso a treinamentos e capacitações.",
      "• Trabalhar em ambiente seguro e saudável.",
      "• Ser tratado com respeito e dignidade.",
      "• Ter seus direitos trabalhistas respeitados (férias, 13º, FGTS, etc.).",
      "• Receber feedback construtivo sobre seu desempenho.",
      "• Ter canal de comunicação aberto com a liderança.",
      "",
      "📋 DEVERES DO COLABORADOR:",
      "• Cumprir a jornada de trabalho com pontualidade.",
      "• Seguir as normas e procedimentos da empresa.",
      "• Atender o cliente com excelência.",
      "• Manter o ambiente de trabalho limpo e organizado.",
      "• Participar de treinamentos e reuniões quando convocado.",
      "• Usar os EPIs quando necessário.",
      "• Comunicar ausências com antecedência.",
      "• Respeitar a hierarquia e os colegas de trabalho."
    ]
  },
  {
    id: "penalidades",
    title: "Penalidades",
    icon: <AlertTriangle className="h-5 w-5" />,
    content: [
      "O descumprimento das normas pode resultar nas seguintes medidas disciplinares:",
      "",
      "1️⃣ ADVERTÊNCIA VERBAL — aplicada em primeira ocorrência leve. Conversa orientativa com registro.",
      "2️⃣ ADVERTÊNCIA ESCRITA — aplicada em reincidência ou faltas moderadas. Documento formal assinado.",
      "3️⃣ SUSPENSÃO — aplicada em faltas graves ou reincidência de advertências. Afastamento de 1 a 30 dias sem remuneração.",
      "4️⃣ DEMISSÃO POR JUSTA CAUSA — aplicada em situações gravíssimas como furto, agressão, abandono de emprego, insubordinação grave ou ato de improbidade.",
      "",
      "⚠️ Exemplos de faltas graves:",
      "• Furto ou desvio de mercadorias.",
      "• Agressão física ou verbal a colegas ou clientes.",
      "• Uso de álcool ou drogas no trabalho.",
      "• Assédio moral ou sexual.",
      "• Falsificação de documentos ou registros.",
      "• Abandono de posto de trabalho sem justificativa."
    ]
  },
  {
    id: "seguranca",
    title: "Segurança e Normas",
    icon: <Lock className="h-5 w-5" />,
    content: [
      "A segurança é responsabilidade de todos. Cada colaborador deve contribuir para um ambiente seguro.",
      "",
      "🔒 NORMAS DE SEGURANÇA:",
      "• Seguir os procedimentos de segurança do trabalho.",
      "• Usar os Equipamentos de Proteção Individual (EPIs) quando necessário.",
      "• Não obstruir saídas de emergência.",
      "• Conhecer a localização dos extintores de incêndio.",
      "• Comunicar imediatamente qualquer situação de risco.",
      "• Não operar equipamentos sem treinamento adequado.",
      "",
      "🛡️ SEGURANÇA PATRIMONIAL:",
      "• Permitir revistas de bolsas e pertences na saída.",
      "• Não permitir a entrada de pessoas não autorizadas em áreas restritas.",
      "• Registrar entrada e saída de mercadorias conforme procedimentos.",
      "• Comunicar qualquer atividade suspeita à segurança ou liderança.",
      "",
      "🔐 SEGURANÇA DA INFORMAÇÃO:",
      "• Não compartilhar senhas de acesso.",
      "• Não divulgar informações confidenciais da empresa.",
      "• Utilizar os sistemas da empresa apenas para fins profissionais."
    ]
  }
];

export default function CodigoEtica() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("apresentacao");

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.content.some((line) => line.toLowerCase().includes(q))
    );
  }, [search]);

  const highlightText = (text: string) => {
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-highlight/40 rounded px-0.5">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Código de Ética e Procedimentos
        </h1>
        <p className="text-muted-foreground">
          Supermercados Curió — Normas, valores e diretrizes para todos os colaboradores
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar no código de ética..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        {/* Chapter navigation */}
        <Card className="h-fit">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Capítulos
            </p>
            <nav className="space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSection(s.id);
                    setSearch("");
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    activeSection === s.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {s.icon}
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-8 pr-4">
            {filteredSections.length === 0 && (
              <p className="text-muted-foreground text-center py-12">
                Nenhum resultado encontrado para "{search}"
              </p>
            )}
            {filteredSections.map((section) => (
              <div key={section.id} id={section.id}>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="gap-1.5 text-sm py-1 px-3">
                    {section.icon}
                    {section.title}
                  </Badge>
                </div>
                <Card>
                  <CardContent className="p-6 space-y-3">
                    {section.content.map((line, i) =>
                      line === "" ? (
                        <div key={i} className="h-2" />
                      ) : (
                        <p key={i} className="text-sm leading-relaxed text-foreground/90">
                          {highlightText(line)}
                        </p>
                      )
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
