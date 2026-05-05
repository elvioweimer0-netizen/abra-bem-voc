export interface HelpEntry {
  titulo: string;
  oque: string;
  comoCalcula: string;
  oqueFazer: string;
}

export const PAINEL_HELP: Record<string, HelpEntry> = {
  vendas_hoje: {
    titulo: "Vai bater meta hoje?",
    oque: "Quanto da meta diária da loja já foi atingido até agora.",
    comoCalcula: "Soma das vendas registradas hoje dividida pela meta do dia.",
    oqueFazer: "Se está abaixo de 80%, foque em ações imediatas: oferta no caixa, push de combos, abrir mais frente.",
  },
  compromisso: {
    titulo: "O que você prometeu?",
    oque: "Compromisso semanal ativo que você assumiu com sua liderança.",
    comoCalcula: "Compromissos abertos com status em andamento.",
    oqueFazer: "Atualize o status ou conclua. Compromisso vence semanalmente.",
  },
  score: {
    titulo: "Sua nota agora",
    oque: "Score consolidado da sua performance no mês.",
    comoCalcula: "Média ponderada de checklist, vendas, equipe e auditoria visual.",
    oqueFazer: "Caiu? Veja em qual dimensão e converse com o supervisor.",
  },
  bonus: {
    titulo: "Quanto você vai ganhar?",
    oque: "Projeção do bônus mensal baseado no ritmo atual.",
    comoCalcula: "Em desenvolvimento. Em breve com base em meta e score.",
    oqueFazer: "Mantenha o score alto e bata as metas semanais.",
  },
  reclamacoes: {
    titulo: "Cliente esperando você",
    oque: "Reclamações de clientes ainda sem resposta.",
    comoCalcula: "Total de reclamações com status aberto na sua unidade.",
    oqueFazer: "Responda em até 24h. Cliente que reclama quer ser ouvido.",
  },
  incidentes: {
    titulo: "Casos pra fechar",
    oque: "Incidentes de segurança em investigação.",
    comoCalcula: "Incidentes com status aberto ou investigação na sua unidade.",
    oqueFazer: "Investigue e registre causa-raiz. Incidente aberto >7 dias gera alerta.",
  },
  produtos_faltando: {
    titulo: "Gôndola vazia",
    oque: "Produtos marcados como faltando pela equipe.",
    comoCalcula: "Lista da última semana ainda não resolvida.",
    oqueFazer: "Verifique reposição e estoque. Ruptura derruba venda.",
  },
  auditoria: {
    titulo: "Fotos pra você ver",
    oque: "Auditorias visuais pendentes da sua unidade.",
    comoCalcula: "Setores sem foto registrada nas últimas 24h.",
    oqueFazer: "Caminhe pela loja com a equipe e registre os setores.",
  },
  churn: {
    titulo: "Atenção com a equipe",
    oque: "Risco de saída detectado em colaboradores.",
    comoCalcula: "Algoritmo cruza humor, faltas, mudança de comportamento e tempo de casa.",
    oqueFazer: "Marque um café 1:1. Ouvir é o primeiro passo.",
  },
  checklist_area: {
    titulo: "Sua área tá em dia?",
    oque: "Checklist diário do seu setor.",
    comoCalcula: "Itens marcados como ok hoje vs total de itens.",
    oqueFazer: "Complete antes do fim do turno.",
  },
  meta_area: {
    titulo: "Meta da sua área",
    oque: "Meta de vendas/produção do seu setor hoje.",
    comoCalcula: "Soma da produção do setor dividida pela meta diária.",
    oqueFazer: "Se está abaixo, ajuste produção ou exposição.",
  },
};
