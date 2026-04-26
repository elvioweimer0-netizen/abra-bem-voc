import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const unitId = '1afcfed3-1a5b-442e-bb20-5c9268d69f74';
const password = 'Teste2026!';

const users = [
  {
    email: 'gerente_teste@curio.app',
    username: 'gerente_teste',
    nome: 'Gerente Teste',
    cargo: 'gerente',
    role: 'gerente',
    setor: null,
    teamRole: 'gerente',
    teamSector: 'geral',
    cargoTitulo: 'Gerente de Loja - TESTE'
  },
  {
    email: 'encarregado_teste@curio.app',
    username: 'encarregado_teste',
    nome: 'Encarregado Teste',
    cargo: 'encarregado',
    role: 'encarregado',
    setor: 'acougue',
    teamRole: 'encarregado',
    teamSector: 'acougue',
    cargoTitulo: 'Encarregado Açougue - TESTE'
  }
];

async function getOrCreateAuthUser(user) {
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', user.email)
    .maybeSingle();
  if (profileError) throw profileError;
  if (existingProfile?.user_id) {
    const { error } = await supabase.auth.admin.updateUserById(existingProfile.user_id, {
      password,
      email_confirm: true,
      user_metadata: {
        nome: user.nome,
        username: user.username,
        cargo: user.cargo,
        unidade: 'CIDADE ALTA',
        must_change_password: false,
        is_test: true
      }
    });
    if (error) throw error;
    return existingProfile.user_id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: {
      nome: user.nome,
      username: user.username,
      cargo: user.cargo,
      unidade: 'CIDADE ALTA',
      must_change_password: false,
      is_test: true
    }
  });
  if (error) throw error;
  return data.user.id;
}

for (const user of users) {
  const userId = await getOrCreateAuthUser(user);

  const { error: profileUpsertError } = await supabase.from('profiles').upsert({
    user_id: userId,
    nome: user.nome,
    email: user.email,
    unidade: 'CIDADE ALTA',
    cargo: user.cargo,
    role: user.role,
    username: user.username,
    must_change_password: false,
    unit_id: unitId,
    cargo_titulo: user.cargoTitulo,
    setor: user.setor,
    is_test: true,
    ativo: true
  }, { onConflict: 'user_id' });
  if (profileUpsertError) throw profileUpsertError;

  const { error: roleError } = await supabase.from('user_roles').upsert({
    user_id: userId,
    role: user.role
  }, { onConflict: 'user_id,role' });
  if (roleError) throw roleError;

  const { data: existingMember, error: memberFindError } = await supabase
    .from('team_members')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (memberFindError) throw memberFindError;

  const memberPayload = {
    user_id: userId,
    unit_id: unitId,
    nome: user.nome,
    role: user.teamRole,
    sector: user.teamSector,
    cargo: user.cargoTitulo,
    status: 'ativo',
    is_demo: false,
    is_test: true
  };

  if (existingMember?.id) {
    const { error } = await supabase.from('team_members').update(memberPayload).eq('id', existingMember.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('team_members').insert(memberPayload);
    if (error) throw error;
  }
}

const { data, error } = await supabase
  .from('profiles')
  .select('username,email,cargo,cargo_titulo,is_test,team_members:team_members(nome,role,sector,cargo,is_test)')
  .in('email', users.map((u) => u.email));
if (error) throw error;
console.log(JSON.stringify(data, null, 2));
