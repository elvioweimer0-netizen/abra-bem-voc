import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const today = new Date();
    const dayOfMonth = today.getDate();

    // 1) Banner mensal — dia 1 a 5: notifica colaboradores ativos que ainda não fizeram check-in
    let bannersSent = 0;
    if (dayOfMonth <= 5) {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('ativo', true)
        .not('user_id', 'is', null);

      const { data: doneRows } = await supabase
        .from('wellbeing_checkins')
        .select('user_id')
        .gte('checkin_date', monthStart);

      const doneSet = new Set((doneRows ?? []).map((r: any) => r.user_id));
      const recipients = (profiles ?? []).filter((p: any) => p.user_id && !doneSet.has(p.user_id));

      for (const p of recipients) {
        await supabase.from('notification_events').insert({
          type: 'wellbeing_monthly_checkin',
          recipient_user_id: p.user_id,
          title: 'Check-in de bem-estar do mês 💚',
          body: 'Como você está? Leva 1 minuto. Anônimo e sem julgamento.',
          payload: { kind: 'wellbeing_monthly_checkin' },
          grouping_key: `wellbeing_monthly:${p.user_id}:${monthStart}`,
        });
        bannersSent++;
      }
    }

    // 2) Alertas RH: %risco>20% nos últimos 30d por unidade
    const { data: agg } = await supabase.rpc('fn_wellbeing_aggregated', { _unit_id: null, _from: null, _to: null });
    const monthKey = today.toISOString().slice(0, 7);
    const highRisk = (agg ?? []).filter((r: any) =>
      String(r.month).slice(0, 7) === monthKey && (Number(r.pct_alerta) + Number(r.pct_critico)) > 20
    );

    let rhAlertsSent = 0;
    if (highRisk.length > 0) {
      const { data: rhRecipients } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'master']);

      for (const u of highRisk) {
        const { data: unit } = await supabase
          .from('units')
          .select('name, code')
          .eq('id', u.unit_id)
          .maybeSingle();

        for (const r of rhRecipients ?? []) {
          await supabase.from('notification_events').insert({
            type: 'wellbeing_high_risk_unit',
            recipient_user_id: r.user_id,
            unit_id: u.unit_id,
            title: 'Alerta de bem-estar',
            body: `${unit?.name ?? unit?.code ?? 'Uma unidade'} com ${(Number(u.pct_alerta) + Number(u.pct_critico)).toFixed(0)}% em risco esse mês.`,
            payload: { kind: 'wellbeing_high_risk', unit_id: u.unit_id, month: u.month },
            grouping_key: `wellbeing_high_risk:${u.unit_id}:${monthKey}`,
          });
          rhAlertsSent++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, banners_sent: bannersSent, rh_alerts_sent: rhAlertsSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
