// Bulk import colaboradores
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

type Row = {
  cpf: string;
  nome: string;
  unit_id: string | null;
  unit_name: string | null;
  setor: string | null;
  cargo: string | null;
  role: "gerente_loja" | "gerente_adm" | "encarregado" | "colaborador";
  posicao_organograma: "gerente_unidade" | "encarregado" | "colaborador";
  is_general_manager: boolean;
  setor_organograma: string;
  codigo_empregado: string | null;
  pis: string | null;
  cbo: string | null;
  pcd_flag: boolean;
  afastado_status: string | null;
  admissao_date: string | null;
  nascimento_date: string | null;
  sexo: string | null;
  periodo: string | null;
};

function normalizeCpf(s: string) { return (s ?? "").replace(/\D/g, ""); }

function isValidCpf(cpf: string) {
  const c = normalizeCpf(cpf);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(c[i]) * (10 - i);
  let d1 = 11 - (s % 11); if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(c[i]) * (11 - i);
  let d2 = 11 - (s % 11); if (d2 >= 10) d2 = 0;
  return d2 === parseInt(c[10]);
}

function tempPassword(cpf: string, nascimento: string | null) {
  if (nascimento) {
    const y = nascimento.slice(0, 4);
    return `${cpf.slice(0, 6)}${y}`;
  }
  return "curio2026";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const token = auth.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // Authorize: master, admin or gerente_adm
    const { data: prof } = await admin.from("profiles").select("cargo, role").eq("user_id", userId).maybeSingle();
    const cargo = (prof as any)?.cargo as string | undefined;
    if (!cargo || !["master", "admin", "gerente_adm"].includes(cargo)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const fileName: string = body?.file_name ?? "import";
    const rows: Row[] = body?.rows ?? [];
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "Sem linhas" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: Array<{ cpf: string; nome: string; status: string; reason?: string; user_id?: string; unit_id?: string | null; setor_organograma?: string; posicao_organograma?: string }> = [];
    let created = 0, updated = 0, failed = 0;

    for (const r of rows) {
      try {
        const cpf = normalizeCpf(r.cpf);
        if (!isValidCpf(cpf)) {
          failed++;
          results.push({ cpf, nome: r.nome, status: "erro", reason: "CPF inválido" });
          continue;
        }
        const email = `${cpf}@curio.local`;
        const password = tempPassword(cpf, r.nascimento_date);

        // Check if profile exists by cpf
        const { data: existingByCpf } = await admin
          .from("profiles")
          .select("id, user_id")
          .eq("cpf", cpf)
          .maybeSingle();

        let authUserId: string | null = (existingByCpf as any)?.user_id ?? null;

        if (!authUserId) {
          // try create user
          const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nome: r.nome, cpf, must_change_password: true },
          });
          if (createErr) {
            // maybe email already taken — try fetch by email via listUsers (cap 1000) or by querying profiles by email
            const { data: profByEmail } = await admin.from("profiles").select("user_id").eq("email", email).maybeSingle();
            authUserId = (profByEmail as any)?.user_id ?? null;
            if (!authUserId) {
              failed++;
              results.push({ cpf, nome: r.nome, status: "erro", reason: createErr.message });
              continue;
            }
          } else {
            authUserId = createdUser.user!.id;
          }
        }

        const profilePayload: Record<string, unknown> = {
          user_id: authUserId,
          nome: r.nome,
          email,
          cpf,
          pis: r.pis,
          cbo: r.cbo,
          codigo_empregado: r.codigo_empregado,
          unit_id: r.unit_id,
          cargo: r.role,
          cargo_text: r.cargo,
          setor_text: r.setor,
          admissao_date: r.admissao_date,
          nascimento_date: r.nascimento_date,
          sexo: r.sexo,
          periodo: r.periodo,
          pcd_flag: r.pcd_flag,
          afastado_status: r.afastado_status,
          is_general_manager: r.is_general_manager,
          posicao_organograma: r.posicao_organograma,
          setor_organograma: r.setor_organograma,
          must_change_password: true,
          ativo: true,
        };

        if (existingByCpf) {
          const { error: upErr } = await admin
            .from("profiles")
            .update(profilePayload)
            .eq("id", (existingByCpf as any).id);
          if (upErr) {
            failed++;
            results.push({ cpf, nome: r.nome, status: "erro", reason: upErr.message });
            continue;
          }
          updated++;
          results.push({ cpf, nome: r.nome, status: "atualizado", user_id: authUserId, unit_id: r.unit_id, setor_organograma: r.setor_organograma, posicao_organograma: r.posicao_organograma });
        } else {
          // upsert by user_id (handle_new_user may have created a stub)
          const { error: insErr } = await admin
            .from("profiles")
            .upsert(profilePayload, { onConflict: "user_id" });
          if (insErr) {
            failed++;
            results.push({ cpf, nome: r.nome, status: "erro", reason: insErr.message });
            continue;
          }
          created++;
          results.push({ cpf, nome: r.nome, status: "criado", user_id: authUserId, unit_id: r.unit_id, setor_organograma: r.setor_organograma, posicao_organograma: r.posicao_organograma });
        }
      } catch (rowErr) {
        failed++;
        console.error("[bulk-import] row error", rowErr);
        results.push({ cpf: r.cpf, nome: r.nome, status: "erro", reason: String(rowErr) });
      }
    }

    // Auto-link supervisor (lider_setor_id) per unit + setor_organograma
    try {
      const successRows = results.filter((x) => x.user_id && x.unit_id);
      const unitIds = Array.from(new Set(successRows.map((x) => x.unit_id).filter(Boolean))) as string[];
      for (const uid of unitIds) {
        // fetch encarregados of the unit
        const { data: encs } = await admin
          .from("profiles")
          .select("id, setor_organograma")
          .eq("unit_id", uid)
          .eq("posicao_organograma", "encarregado");
        const encBySetor = new Map<string, string>();
        for (const e of (encs ?? []) as any[]) {
          if (e.setor_organograma) encBySetor.set(e.setor_organograma, e.id);
        }
        // fetch gerente da unidade
        const { data: gerente } = await admin
          .from("profiles")
          .select("id")
          .eq("unit_id", uid)
          .eq("posicao_organograma", "gerente_unidade")
          .limit(1)
          .maybeSingle();
        const gerenteId = (gerente as any)?.id ?? null;

        // assign lider_setor_id for colaboradores in this unit
        const { data: colabs } = await admin
          .from("profiles")
          .select("id, setor_organograma")
          .eq("unit_id", uid)
          .eq("posicao_organograma", "colaborador");
        for (const c of (colabs ?? []) as any[]) {
          const target = encBySetor.get(c.setor_organograma) ?? gerenteId;
          if (target && target !== c.id) {
            await admin.from("profiles").update({ lider_setor_id: target }).eq("id", c.id);
          }
        }
      }
    } catch (linkErr) {
      console.error("[bulk-import] link supervisor error", linkErr);
    }

    await admin.from("bulk_import_log").insert({
      performed_by: userId,
      file_name: fileName,
      total_rows: rows.length,
      successful: created,
      updated,
      failed,
      details: { results: results.slice(0, 500) },
    });

    return new Response(
      JSON.stringify({ created, updated, failed, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[bulk-import]", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
