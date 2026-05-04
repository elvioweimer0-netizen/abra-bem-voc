ALTER VIEW public.v_wellbeing_aggregated SET (security_invoker = true);

REVOKE EXECUTE ON FUNCTION public.fn_wellbeing_aggregated(uuid, date, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_wellbeing_critical_alerts() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.fn_my_checkin_done_this_month() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.wellbeing_hash_user(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.fn_wellbeing_aggregated(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_wellbeing_critical_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_my_checkin_done_this_month() TO authenticated;