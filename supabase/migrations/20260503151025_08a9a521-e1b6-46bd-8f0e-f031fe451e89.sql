
DROP VIEW IF EXISTS public.v_auditoria_visual;

CREATE VIEW public.v_auditoria_visual
WITH (security_invoker=true) AS
SELECT
  r.id            AS response_id,
  r.foto_url,
  r.observacao,
  r.completed_at,
  r.completion_id,
  i.id            AS item_id,
  i.descricao     AS item_text,
  i.requires_photo,
  t.id            AS template_id,
  t.name          AS template_name,
  c.data          AS completion_data,
  c.user_id       AS gestor_user_id,
  p.nome          AS gestor_nome,
  p.cargo::text   AS gestor_cargo,
  u.id            AS unit_id,
  u.code          AS unit_code,
  u.name          AS unit_name
FROM public.checklist_item_responses r
JOIN public.checklist_items i ON i.id = r.item_id
JOIN public.checklist_completions c ON c.id = r.completion_id
LEFT JOIN public.checklist_templates t ON t.id = c.template_id
LEFT JOIN public.units u ON u.id = c.unit_id
LEFT JOIN public.profiles p ON p.user_id = c.user_id
WHERE r.foto_url IS NOT NULL AND r.foto_url <> '';

GRANT SELECT ON public.v_auditoria_visual TO authenticated;
