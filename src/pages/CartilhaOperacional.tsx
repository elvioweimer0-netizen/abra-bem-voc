import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Search, ClipboardList, UserCheck, HeartHandshake, ShieldCheck,
  CreditCard, CheckSquare, Users, AlertOctagon,
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const sections: Section[] = [
  {
    id: "postura-etica",
    title: "Postura e Ética no Trabalho",
    icon: <UserCheck className="h-5 w-5" />,
    content: [
      "O colaborador do Curió Supermercado é a primeira impressão que o cliente tem da empresa. Sua postura reflete diretamente a imagem e os valores da marca.",
      "",
      "📌 Regras de postura:",
      "• Manter-se sempre com postura ereta e profissional.",
      "• Usar o uniforme completo, limpo e bem cuidado.",
      "• Não utilizar celular durante o atendimento ao cliente.",
      "• Não mascar chicletes, comer ou beber no salão de vendas.",
      "• Não fazer brincadeiras ou conversas paralelas durante o expediente.",
      "• Manter o cabelo preso e unhas curtas e limpas.",
      "• Não usar acessórios excessivos (brincos grandes, anéis, pulseiras).",
      "• Chegar ao posto de trabalho 5 minutos antes do início do turno.",
      "• Manter o ambiente limpo e organizado em todos os momentos."
    ]
  },
  {
    id: "atendimento",
    title: "Atendimento ao Cliente",
    icon: <HeartHandshake className="h-5 w-5" />,
    content: [
      "O cliente é a razão da existência da nossa empresa. Todo atendimento deve ser feito com cordialidade, agilidade e respeito.",
      "",
      "✅ Regras de ouro do atendimento:",
      "• Cumprimentar o cliente com um sorriso: \"Bom dia!\", \"Boa tarde!\", \"Boa noite!\".",
      "• Olhar nos olhos do cliente durante a interação.",
      "• Ser ágil e eficiente no atendimento.",
      "• Nunca ignorar um cliente — mesmo se estiver ocupado, sinalize que irá atendê-lo.",
      "• Sempre agradecer ao final: \"Obrigado por comprar no Curió!\".",
      "• Não discutir com o cliente — em caso de conflito, chamar o líder.",
      "• Oferecer ajuda proativamente: \"Posso ajudá-lo em algo?\".",
      "",
      "⚠️ O que NÃO fazer:",
      "• Atender de cara fechada ou com má vontade.",
      "• Conversar com colegas enquanto o cliente espera.",
      "• Usar o celular durante o atendimento.",
      "• Dar respostas secas como \"não sei\" — busque a informação.",
      "• Comentar sobre problemas internos na frente do cliente."
    ]
  },
  {
    id: "lideranca",
    title: "Liderança e Gestão",
    icon: <Users className="h-5 w-5" />,
    content: [
      "Os líderes do Curió têm papel fundamental na formação e motivação da equipe.",
      "",
      "📋 Responsabilidades do líder:",
      "• Dar o exemplo em postura, ética e atendimento.",
      "• Orientar e treinar os colaboradores de forma respeitosa.",
      "• Acompanhar o desempenho da equipe diariamente.",
      "• Aplicar feedbacks construtivos e frequentes.",
      "• Resolver conflitos com imparcialidade.",
      "• Garantir o cumprimento das normas e procedimentos.",
      "• Comunicar informações relevantes à equipe com clareza.",
      "• Motivar e reconhecer o bom trabalho dos colaboradores.",
      "",
      "O líder do Curió não apenas gerencia — ele inspira."
    ]
  },
  {
    id: "procedimentos-caixa",
    title: "Procedimentos de Caixa",
    icon: <CreditCard className="h-5 w-5" />,
    content: [
      "O operador de caixa tem uma das funções mais importantes do supermercado. Exige atenção, responsabilidade e agilidade.",
      "",
      "💰 Abertura do caixa:",
      "• Conferir o fundo de troco antes de iniciar.",
      "• Verificar se o equipamento está funcionando (impressora, scanner, pin pad).",
      "• Fazer login no sistema com suas credenciais pessoais.",
      "• Nunca usar login de outro colaborador.",
      "",
      "🛒 Durante o atendimento:",
      "• Registrar todos os produtos corretamente.",
      "• Conferir se o preço no sistema está correto.",
      "• Perguntar a forma de pagamento antes de finalizar.",
      "• Contar o troco na frente do cliente.",
      "• Não deixar dinheiro fora do caixa ou embaixo do teclado.",
      "",
      "🔒 Fechamento do caixa:",
      "• Contar todo o dinheiro e conferir com o sistema.",
      "• Separar os comprovantes de cartão.",
      "• Preencher o relatório de fechamento.",
      "• Entregar o malote lacrado ao responsável.",
      "• Comunicar qualquer diferença ao líder imediatamente."
    ]
  },
  {
    id: "seguranca-golpes",
    title: "Segurança e Prevenção de Golpes",
    icon: <ShieldCheck className="h-5 w-5" />,
    content: [
      "A segurança financeira é responsabilidade de cada colaborador. Conhecer os principais golpes ajuda a preveni-los.",
      "",
      "🚨 Golpes comuns:",
      "• Troca de notas: cliente entrega uma nota e alega ter dado outra de valor maior.",
      "• Distração: cliente conversa demais para confundir o operador durante o troco.",
      "• Cartão clonado: atentar para cartões sem chip ou com assinatura diferente.",
      "• PIX falso: sempre confirmar o recebimento no sistema antes de liberar a compra.",
      "• Nota falsa: verificar os elementos de segurança (marca d'água, fio de segurança).",
      "",
      "🛡️ Como se proteger:",
      "• Não se distraia durante a operação financeira.",
      "• Conte o troco com calma, na frente do cliente.",
      "• Em caso de dúvida sobre uma nota, chame o líder.",
      "• Nunca passe valores altos sem confirmação do supervisor.",
      "• Não aceite pressão para agilizar operações suspeitas.",
      "• Relate qualquer situação suspeita imediatamente."
    ]
  },
  {
    id: "checklist",
    title: "Checklist Diário",
    icon: <CheckSquare className="h-5 w-5" />,
    content: [
      "O checklist garante que cada turno comece de forma organizada e eficiente.",
      "",
      "☑️ ANTES DE INICIAR O TURNO:",
      "• Vestir uniforme completo e crachá.",
      "• Verificar aparência pessoal (cabelo, unhas, higiene).",
      "• Chegar 5 minutos antes do horário.",
      "• Conferir comunicados do dia no mural ou sistema.",
      "",
      "☑️ DURANTE O TURNO:",
      "• Manter o posto de trabalho limpo e organizado.",
      "• Atender todos os clientes com cordialidade.",
      "• Seguir os procedimentos operacionais do setor.",
      "• Comunicar qualquer problema ao líder.",
      "",
      "☑️ AO FINALIZAR O TURNO:",
      "• Organizar o posto de trabalho para o próximo turno.",
      "• Fazer o fechamento conforme procedimentos do setor.",
      "• Entregar relatórios quando necessário.",
      "• Registrar o ponto de saída corretamente."
    ]
  },
  {
    id: "responsabilidades",
    title: "Responsabilidades por Função",
    icon: <ClipboardList className="h-5 w-5" />,
    content: [
      "Cada função no Curió tem responsabilidades específicas que devem ser cumpridas com excelência.",
      "",
      "🏪 OPERADOR DE CAIXA:",
      "• Registrar produtos, receber pagamentos e dar troco corretamente.",
      "• Manter o caixa limpo e organizado.",
      "• Atender com agilidade e cordialidade.",
      "",
      "📦 REPOSITOR:",
      "• Abastecer as gôndolas conforme PVPS (Primeiro que Vence, Primeiro que Sai).",
      "• Manter a organização e limpeza do setor.",
      "• Verificar datas de validade dos produtos.",
      "",
      "🥩 AÇOUGUE / 🍞 PADARIA / 🥬 HORTIFRUTI:",
      "• Seguir os procedimentos de higiene e manipulação de alimentos.",
      "• Manter o setor limpo e bem apresentado.",
      "• Atender o cliente com conhecimento dos produtos.",
      "",
      "👔 LÍDER DE SETOR:",
      "• Acompanhar e orientar a equipe.",
      "• Garantir o cumprimento das metas e procedimentos.",
      "• Resolver problemas operacionais rapidamente.",
      "",
      "🏢 GERENTE DE UNIDADE:",
      "• Gerenciar os resultados da unidade.",
      "• Liderar os líderes de setor.",
      "• Representar a empresa junto à comunidade e clientes."
    ]
  },
  {
    id: "situacoes-especiais",
    title: "Situações Especiais",
    icon: <AlertOctagon className="h-5 w-5" />,
    content: [
      "Algumas situações exigem atenção especial e procedimentos específicos.",
      "",
      "🤝 CLIENTE DIFÍCIL:",
      "• Mantenha a calma e ouça o cliente.",
      "• Não leve para o lado pessoal.",
      "• Tente resolver o problema dentro da sua alçada.",
      "• Se necessário, chame o líder ou gerente.",
      "• Nunca discuta ou eleve o tom de voz.",
      "",
      "💸 FALTA DE TROCO:",
      "• Comunique ao líder imediatamente.",
      "• Não peça troco emprestado a outros caixas sem autorização.",
      "• Sugira ao cliente forma de pagamento alternativa.",
      "",
      "🔧 PROBLEMA NO EQUIPAMENTO:",
      "• Comunique ao líder ou suporte técnico.",
      "• Não tente consertar equipamentos por conta própria.",
      "• Se necessário, transfira o atendimento para outro caixa.",
      "",
      "🚑 EMERGÊNCIA:",
      "• Em caso de acidente, chame o líder e o SAMU (192).",
      "• Em caso de incêndio, siga o plano de evacuação.",
      "• Mantenha a calma e oriente os clientes."
    ]
  }
];

export default function CartilhaOperacional() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("postura-etica");

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
          <ClipboardList className="h-6 w-6 text-primary" />
          Cartilha Operacional — Frente de Caixa
        </h1>
        <p className="text-muted-foreground">
          Guia completo de procedimentos, atendimento e operação do Curió Supermercado
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar na cartilha..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <Card className="h-fit">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Seções
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
