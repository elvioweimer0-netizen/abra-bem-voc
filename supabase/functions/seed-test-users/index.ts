import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UNIT_ID = "1afcfed3-1a5b-442e-bb20-5c9268d69f74";
const UNIDADE = "CIDADE ALTA";
const PASSWORD = "TesteCurio2026!";

const TEST_USERS = [
  { username: "master_teste", cargo: "master", nome: "Master Teste" },
  { username: "admin_teste", cargo: "admin", nome: "Admin Teste" },
  { username: "supervisor_teste", cargo: "supervisor", nome: "Supervisor Teste" },
  { username: "gerente_adm_teste", cargo: "gerente_adm", nome: "Gerente Adm Teste" },
  { username: "gerente_loja_teste", cargo: "gerente_loja", nome: "Gerente Loja Teste" },
  { username: "encarregado_teste", cargo: "encarregado", nome: "Encarregado Teste" },
  { username: "fiscal_teste", cargo: "fiscal", nome: "Fiscal Teste" },
  { username: "lider_setor_teste", cargo: "lider_setor", nome: "Líder Setor Teste" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: any[] = [];

  for (const u of TEST_USERS) {
    const email = `${u.username}@curio.app`;
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

      if (existing?.user_id) {
        results.push({ username: u.username, status: "exists" });
        continue;
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          nome: u.nome,
          username: u.username,
          cargo: u.cargo,
          unidade: UNIDADE,
          must_change_password: false,
        },
      });

      if (error) {
        results.push({ username: u.username, status: "error", error: error.message });
        continue;
      }

      const userId = data.user!.id;

      // Update profile with unit_id and is_test
      await supabase
        .from("profiles")
        .update({ unit_id: UNIT_ID, is_test: true })
        .eq("user_id", userId);

      results.push({ username: u.username, status: "created", user_id: userId });
    } catch (e) {
      results.push({ username: u.username, status: "exception", error: String(e) });
    }
  }

  return new Response(JSON.stringify({ password: PASSWORD, results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
