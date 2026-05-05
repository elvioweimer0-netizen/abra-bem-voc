
-- Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS painel_mode text NOT NULL DEFAULT 'simples' CHECK (painel_mode IN ('simples','completo')),
  ADD COLUMN IF NOT EXISTS painel_onboarding_seen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS audio_painel_enabled boolean NOT NULL DEFAULT false;

-- curio_messages
CREATE TABLE IF NOT EXISTS public.curio_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  message text NOT NULL,
  context text NOT NULL CHECK (context IN ('saudacao_manha','saudacao_tarde','saudacao_noite','saudacao_madrugada','alerta_meta','alerta_churn','elogio_streak','dica_padaria','dica_caixa','dica_estoque','aniversario_equipe','marco_casa','sem_visita_dono','feedback_baixo','generico')),
  role_target text[] NULL,
  tone text NOT NULL DEFAULT 'amigavel' CHECK (tone IN ('amigavel','preocupado','animado','formal')),
  priority smallint NOT NULL DEFAULT 5,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.curio_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "curio_messages_select_auth" ON public.curio_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "curio_messages_admin_write" ON public.curio_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

-- recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  action_link text,
  priority smallint NOT NULL DEFAULT 5,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON public.recommendations(target_user_id, dismissed_at, expires_at);
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recs_select_own" ON public.recommendations FOR SELECT TO authenticated USING (target_user_id = auth.uid());
CREATE POLICY "recs_update_own" ON public.recommendations FOR UPDATE TO authenticated USING (target_user_id = auth.uid()) WITH CHECK (target_user_id = auth.uid());
CREATE POLICY "recs_admin_insert" ON public.recommendations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

-- frases_do_dia
CREATE TABLE IF NOT EXISTS public.frases_do_dia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frase text NOT NULL,
  autor text,
  dia_semana smallint,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.frases_do_dia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "frases_select_auth" ON public.frases_do_dia FOR SELECT TO authenticated USING (true);
CREATE POLICY "frases_admin_write" ON public.frases_do_dia FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

-- painel_opens
CREATE TABLE IF NOT EXISTS public.painel_opens (
  user_id uuid NOT NULL,
  opened_date date NOT NULL,
  PRIMARY KEY (user_id, opened_date)
);
ALTER TABLE public.painel_opens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opens_select_own" ON public.painel_opens FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "opens_insert_own" ON public.painel_opens FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Seeds (curio_messages ~ a few representative; we add many)
INSERT INTO public.curio_messages (code, message, context, tone, priority) VALUES
('saud_m_1','Bom dia, time! Bora fazer um dia bonito.','saudacao_manha','animado',7),
('saud_m_2','Oi! Café na mão e olho na padaria, hein.','saudacao_manha','amigavel',6),
('saud_m_3','Bom diaaa! Hoje tem cliente pra conquistar.','saudacao_manha','animado',5),
('saud_m_4','Manhã começa cedo e bem feita. Vamo!','saudacao_manha','amigavel',4),
('saud_m_5','Bom dia! Antes de tudo, dá um olhada no checklist.','saudacao_manha','formal',5),
('saud_m_6','Acordou bem? A loja tá te esperando.','saudacao_manha','amigavel',4),
('saud_m_7','Bom dia! Clima leve, foco no cliente.','saudacao_manha','amigavel',5),
('saud_m_8','Hoje é dia de bater meta, sente esse cheiro?','saudacao_manha','animado',6),
('saud_m_9','Bom dia. Olha rápido as gôndolas antes da abertura.','saudacao_manha','formal',7),
('saud_m_10','Bom dia! Reza-pra-ti que vai ser um belo dia.','saudacao_manha','amigavel',3),
('saud_t_1','Boa tarde! Como tá o ritmo?','saudacao_tarde','amigavel',5),
('saud_t_2','Tarde de produção. Bora fechar a meta!','saudacao_tarde','animado',6),
('saud_t_3','Boa tarde, líder. Ajustes de fim de turno?','saudacao_tarde','formal',5),
('saud_t_4','Tarde firme! Caixa flui, equipe junto.','saudacao_tarde','animado',5),
('saud_t_5','Boa tarde! Hora de revisar elogios e marcar 1:1.','saudacao_tarde','amigavel',4),
('saud_t_6','Tarde tranquila ou puxada? Tô torcendo!','saudacao_tarde','amigavel',3),
('saud_t_7','Boa tarde! Padaria reabasteceu? Olha lá.','saudacao_tarde','formal',6),
('saud_t_8','Tarde produtiva. Bora fechar bonito.','saudacao_tarde','animado',5),
('saud_n_1','Boa noite. Hora de respirar e olhar o dia.','saudacao_noite','amigavel',5),
('saud_n_2','Noite chegando. Já registrou o que rolou?','saudacao_noite','formal',6),
('saud_n_3','Boa noite! Foi um daqueles dias?','saudacao_noite','amigavel',4),
('saud_n_4','Noite. Resumo rápido e descansa, line!','saudacao_noite','amigavel',5),
('saud_n_5','Boa noite. Amanhã tem mais. Bora documentar hoje.','saudacao_noite','formal',6),
('saud_md_1','Madrugada por aí? Cuida de você também.','saudacao_madrugada','preocupado',7),
('saud_md_2','Tá tarde, líder. Só urgência por agora.','saudacao_madrugada','preocupado',6),
('alerta_meta_1','Atenção: meta tá longe. Que tal um push na frente de caixa?','alerta_meta','preocupado',8),
('alerta_meta_2','Hoje tá puxado pra meta. Bora reagir agora.','alerta_meta','preocupado',7),
('alerta_meta_3','Ainda dá pra virar. Foco nas próximas 2 horas.','alerta_meta','animado',6),
('alerta_churn_1','Cuidado: alguém da equipe pode tar pensando em sair. Conversa hoje.','alerta_churn','preocupado',9),
('alerta_churn_2','Sentimento da equipe tá em baixa. Um café com eles ajuda muito.','alerta_churn','preocupado',8),
('elogio_streak_1','Você tá ON ha vários dias seguidos. Orgulho!','elogio_streak','animado',6),
('elogio_streak_2','Constância é tudo. Continua assim, líder.','elogio_streak','amigavel',5),
('elogio_streak_3','Streak ativa! Equipe nota quando o líder aparece.','elogio_streak','animado',7),
('dica_padaria_1','Padaria: confere variedade de pão doce na vitrine.','dica_padaria','formal',5),
('dica_padaria_2','Dica: produção da tarde começa antes das 15h.','dica_padaria','formal',6),
('dica_padaria_3','Padaria zerada de bolo? É o que mais sai.','dica_padaria','formal',5),
('dica_caixa_1','Frente de caixa: mais de 3 pessoas na fila? Abre outro.','dica_caixa','formal',7),
('dica_caixa_2','Caixa: uniforme e sorriso fazem o cliente voltar.','dica_caixa','amigavel',5),
('dica_caixa_3','Operadora cansada rende menos. Faz rodízio.','dica_caixa','formal',6),
('dica_estoque_1','Estoque: ruptura em hortifruti dói no caixa. Confere.','dica_estoque','formal',7),
('dica_estoque_2','Vencimento perto? Frente de loja com sinal.','dica_estoque','formal',6),
('dica_estoque_3','Estoque organizado economiza tempo amanhã.','dica_estoque','amigavel',5),
('aniv_eq_1','Hoje tem aniversário na equipe! Não esquece.','aniversario_equipe','animado',9),
('aniv_eq_2','Aniversariante na casa. Um abraço vale ouro.','aniversario_equipe','amigavel',8),
('marco_casa_1','Hoje alguém faz aniversário de Curió. Reconhece!','marco_casa','animado',9),
('marco_casa_2','Tempo de casa marca. Vai lá agradecer.','marco_casa','amigavel',7),
('sem_dono_1','Faz tempo que o dono não passa. Tudo em ordem?','sem_visita_dono','formal',6),
('sem_dono_2','Sem visita do dono há semanas. Capricha.','sem_visita_dono','formal',5),
('feed_baixo_1','Feedback espelho da equipe caiu. Vale uma conversa franca.','feedback_baixo','preocupado',8),
('feed_baixo_2','Equipe tá te dando sinal. Escuta com calma.','feedback_baixo','preocupado',7),
('gen_1','Lembre: pequena ação consistente vale mais que grande gesto raro.','generico','amigavel',3),
('gen_2','Você não tá sozinho. Time todo joga junto.','generico','amigavel',4),
('gen_3','Cliente bem atendido volta. Sempre.','generico','formal',5),
('gen_4','Pequeno detalhe na gôndola = grande impressão.','generico','formal',4),
('gen_5','Liderar é ouvir antes de falar.','generico','formal',5),
('gen_6','Reconhecer a equipe não custa nada e gera tudo.','generico','amigavel',6),
('gen_7','Hoje é só mais um dia. E também é o único que tem.','generico','amigavel',4),
('gen_8','Erro acontece. Aprender é o que conta.','generico','amigavel',5),
('gen_9','Foco no cliente, resto se ajeita.','generico','formal',5),
('gen_10','Disciplina vence motivação a longo prazo.','generico','formal',5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.frases_do_dia (frase, autor) VALUES
('Excelência é fazer o ordinário extraordinariamente bem.', NULL),
('Cliente bem atendido é a melhor propaganda.', NULL),
('Equipe forte vence dias difíceis.', NULL),
('Pequenos detalhes constroem grandes lojas.', NULL),
('Liderar é servir.', NULL),
('Foco no que importa hoje.', NULL),
('Sorriso na frente, ordem no estoque.', NULL),
('Reconhecer fortalece.', NULL),
('Padrão alto, resultado alto.', NULL),
('Disciplina é liberdade.', NULL),
('Quem cuida, colhe.', NULL),
('Conversa franca evita problema futuro.', NULL),
('Constância vence talento.', NULL),
('Quem mede, melhora.', NULL),
('Atitude positiva contagia o time.', NULL),
('Sem desculpa: ação.', NULL),
('Limpeza é cartão de visita.', NULL),
('Gôndola cheia, cliente feliz.', NULL),
('Erro mostra caminho.', NULL),
('Ouvir é o começo da liderança.', NULL),
('Hoje é treino pra amanhã.', NULL),
('Cada cliente é uma chance única.', NULL),
('Pressa estraga, ritmo entrega.', NULL),
('Time unido entrega o impossível.', NULL),
('Cliente nota quem se importa.', NULL),
('Quem reclama melhora a casa.', NULL),
('Bom líder forma outros líderes.', NULL),
('Detalhe é o que separa.', NULL),
('Comunique cedo, evite ruído.', NULL),
('Entregue mais do que o esperado.', NULL),
('Treine quando ninguém pede.', NULL),
('Capriche mesmo quando ninguém vê.', NULL),
('Cliente fiel nasce de pequenos gestos.', NULL),
('Dia ruim é só um dia.', NULL),
('Reconhecimento sincero move equipe.', NULL),
('Foco no controlável.', NULL),
('Trabalho bem feito é orgulho próprio.', NULL),
('Pergunta certa vale mais que mil respostas.', NULL),
('Atenção é o maior presente.', NULL),
('Faça hoje o que evita amanhã.', NULL),
('Cliente perdido lembra mais que cliente ganho.', NULL),
('Dê o exemplo, não só a ordem.', NULL),
('Mais simples sempre melhor.', NULL),
('Padaria limpa, cliente confia.', NULL),
('Hortifruti vivo, loja viva.', NULL),
('Equipe sente quando o líder cuida.', NULL),
('Toda meta começa hoje.', NULL),
('Boa hora pra agradecer alguém.', NULL),
('Trabalhar em time multiplica.', NULL),
('Cliente nota mais o como do que o o quê.', NULL)
ON CONFLICT DO NOTHING;
