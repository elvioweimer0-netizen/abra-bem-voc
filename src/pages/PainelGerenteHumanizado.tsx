// PAINEL HUMANIZADO DO GERENTE - NÃO SUBSTITUIR. Se precisar mexer, pergunte ao usuário.
// Este arquivo é a versão "oficial" do painel do gerente_loja. Qualquer try-fix ou refactor
// futuro NÃO deve tocar nesse arquivo a menos que o usuário peça explicitamente.
//
// Layout esperado (na ordem):
//  1) Header com gradient (gradient-curio) + saudação dinâmica + frase do dia
//  2) Toggle Simples/Completo + botão "Ouvir resumo" (TTS) + StreakBadge
//  3) CurioFalante (mascote com balão de fala)
//  4) Card destacado "Veja sua equipe no organograma" (VerOrganogramaWidget)
//  5) 4 KPIs em pergunta humana (Vai bater meta? / O que prometeu? / Sua nota / Bônus)
//  6) Recomendações do dia
//  7) 5 ações rápidas (Iniciar meu dia / +Incidente / +Reclamação / +Aviso / Resumo WhatsApp)
//  8) Pendências + Equipe overview em 2 colunas
//  9) (modo completo) Compromissos / Desenvolvimento / Alertas
//
// Implementação delegada a PainelGerente.tsx para evitar duplicação.
import PainelGerente from "@/pages/PainelGerente";

export default function PainelGerenteHumanizado(props: { unitOverride?: string; gerenteName?: string } = {}) {
  return <PainelGerente {...props} />;
}
