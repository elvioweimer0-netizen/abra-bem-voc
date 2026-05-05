import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

// Generates a weekly PDF report and uploads to master-reports bucket, returning a signed URL.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const { data: snaps } = await supabase
      .from("master_snapshots")
      .select("snapshot_date, kpis, alerts, top_movers")
      .gte("snapshot_date", since)
      .order("snapshot_date");

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório Semanal da Rede", 14, 20);
    doc.setFontSize(10);
    doc.text(`Período: ${since} a ${today}`, 14, 28);

    let y = 40;
    let totalRevenue = 0;
    let totalIncidents = 0;
    let totalMissing = 0;
    (snaps ?? []).forEach((s: any) => {
      totalRevenue += Number(s.kpis?.revenue ?? 0);
      totalIncidents += Number(s.kpis?.incidents ?? 0);
      totalMissing += Number(s.kpis?.missing ?? 0);
    });

    doc.setFontSize(12);
    doc.text("KPIs Consolidados", 14, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Receita total: R$ ${totalRevenue.toLocaleString("pt-BR")}`, 14, y); y += 6;
    doc.text(`Incidentes: ${totalIncidents}`, 14, y); y += 6;
    doc.text(`Ruptura (produtos faltando): ${totalMissing}`, 14, y); y += 10;

    doc.setFontSize(12);
    doc.text("Snapshots da semana", 14, y); y += 8;
    doc.setFontSize(9);
    (snaps ?? []).slice(0, 30).forEach((s: any) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const line = `${s.snapshot_date} — Receita R$ ${Number(s.kpis?.revenue ?? 0).toLocaleString("pt-BR")} | Inc: ${s.kpis?.incidents ?? 0} | Falt: ${s.kpis?.missing ?? 0} | Status: ${s.kpis?.status ?? "—"}`;
      doc.text(line, 14, y); y += 5;
    });

    const pdfBytes = doc.output("arraybuffer");
    const path = `weekly/${today}-${crypto.randomUUID().slice(0, 8)}.pdf`;

    const { error: upErr } = await supabase.storage.from("master-reports").upload(path, new Uint8Array(pdfBytes), {
      contentType: "application/pdf",
      upsert: false,
    });
    if (upErr) throw upErr;

    const { data: signed, error: sErr } = await supabase.storage.from("master-reports").createSignedUrl(path, 60 * 60);
    if (sErr) throw sErr;

    return new Response(JSON.stringify({ ok: true, url: signed.signedUrl, path }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
