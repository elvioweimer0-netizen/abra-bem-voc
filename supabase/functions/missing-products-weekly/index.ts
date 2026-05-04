import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2.95.0/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

    const { data: requests, error: reqErr } = await supabase
      .from('missing_product_requests')
      .select('id, product_name, customer_count, status, created_at')
      .gte('created_at', weekAgo)
      .order('priority_score', { ascending: false })
      .limit(20);
    if (reqErr) throw reqErr;

    const newCount = (requests ?? []).length;
    const openCount = (requests ?? []).filter((r: any) => r.status === 'aberto').length;

    if (newCount === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'no new requests' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const top5 = (requests ?? []).slice(0, 5)
      .map((r: any, i: number) => `${i + 1}. ${r.product_name} (${r.customer_count})`)
      .join(' • ');

    // Recipients: admin/master/supervisor/gerente_adm
    const { data: buyers, error: buyersErr } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('ativo', true)
      .in('cargo', ['admin', 'master', 'supervisor', 'gerente_adm']);
    if (buyersErr) throw buyersErr;

    const recipients = Array.from(new Set((buyers ?? []).map((b: any) => b.user_id).filter(Boolean)));
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'no buyers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const events = recipients.map((uid) => ({
      type: 'high_occurrence',
      recipient_user_id: uid,
      title: `${newCount} pedidos de produtos faltando essa semana`,
      body: `${openCount} ainda em aberto. Top: ${top5}`,
      payload: { new_count: newCount, open_count: openCount, top: top5 },
      grouping_key: `missing_products_weekly:${today}:${uid}`,
    }));

    const { error: insErr } = await supabase.from('notification_events').insert(events);
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, sent: events.length, new_count: newCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
