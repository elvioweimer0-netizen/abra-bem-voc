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
    // Find accepted coverage_requests with shift starting in ~2h, not yet reminded
    const now = new Date();
    const lower = new Date(now.getTime() + 1 * 60 * 60 * 1000 + 55 * 60 * 1000);
    const upper = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);

    const { data: candidates, error } = await supabase
      .from('coverage_requests')
      .select('id, target_date, target_shift_start, accepted_by_user_id, requester_unit_id, reminded_at, status')
      .eq('status', 'aceito')
      .is('reminded_at', null)
      .not('accepted_by_user_id', 'is', null);

    if (error) throw error;

    const sent: string[] = [];
    for (const r of candidates ?? []) {
      const start = new Date(`${r.target_date}T${r.target_shift_start}`);
      if (start < lower || start > upper) continue;

      // get user_id of accepted profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .eq('id', r.accepted_by_user_id)
        .maybeSingle();
      if (!prof?.user_id) continue;

      const { data: unit } = await supabase
        .from('units')
        .select('name')
        .eq('id', r.requester_unit_id)
        .maybeSingle();

      await supabase.from('notification_events').insert({
        type: 'meeting_reminder',
        recipient_user_id: prof.user_id,
        title: 'Lembrete: cobertura em 2h',
        body: `Você cobre turno em ${unit?.name ?? 'outra loja'} às ${String(r.target_shift_start).slice(0, 5)}.`,
        payload: { kind: 'coverage_reminder', request_id: r.id },
        grouping_key: `coverage_reminder:${r.id}`,
      });

      await supabase
        .from('coverage_requests')
        .update({ reminded_at: new Date().toISOString() })
        .eq('id', r.id);

      sent.push(r.id);
    }

    return new Response(JSON.stringify({ ok: true, sent: sent.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
