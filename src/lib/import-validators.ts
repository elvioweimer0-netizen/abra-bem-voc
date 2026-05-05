import { normalizeCpf, isValidCpf } from "./cpf";

export type RawRow = Record<string, any>;
export type UnitKind = "loja" | "cp" | "cd" | "cpa" | "adm";

export type ValidatedRow = {
  index: number;
  raw: RawRow;
  status: "ok" | "aviso" | "erro";
  reasons: string[];
  normalized: {
    cpf: string;
    nome: string;
    unidade_input: string;
    unit_id: string | null;
    unit_name: string | null;
    unit_kind: UnitKind | null;
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
};

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const norm = (s: any) => stripAccents(String(s ?? "")).trim().toUpperCase();

export function mapHeader(h: string): string {
  const k = stripAccents(String(h ?? "").toLowerCase().trim());
  if (k.startsWith("unidade")) return "unidade";
  if (k.includes("cod") && k.includes("unid")) return "cod_unidade";
  if (k.startsWith("nome")) return "nome";
  if (k === "cpf") return "cpf";
  if (k.startsWith("setor")) return "setor";
  if (k.includes("cod") && k.includes("emp")) return "codigo_empregado";
  if (k === "pcd") return "pcd";
  if (k === "pis") return "pis";
  if (k === "cbo") return "cbo";
  if (k.startsWith("admiss")) return "admissao";
  if (k.startsWith("nasc")) return "nascimento";
  if (k.startsWith("sexo")) return "sexo";
  if (k.startsWith("periodo") || k.startsWith("período")) return "periodo";
  if (k.startsWith("afast")) return "afastado";
  if (k.startsWith("cargo")) return "cargo";
  if (k.startsWith("email") || k.startsWith("e-mail")) return "email";
  return k.replace(/\s+/g, "_");
}

export function inferRole(cargo: string): ValidatedRow["normalized"]["role"] {
  const c = norm(cargo);
  if (/(^|\s)RH(\s|$)|DEPARTAMENTO\s+PESSOAL|FINANCEIRO|CONTROLLER|ASSISTENTE\s+DE\s+DP|ASSISTENTE\s+FINANCEIRO/.test(c))
    return "gerente_adm";
  if (c.includes("ENCARREGADO") || c.includes("SUBGERENTE")) return "encarregado";
  if (c.includes("GERENTE")) return "gerente_loja";
  return "colaborador";
}

export function inferIsGeneralManager(cargo: string): boolean {
  const c = norm(cargo);
  return c.includes("GERENTE GERAL");
}

export function inferPosicaoOrganograma(cargo: string): ValidatedRow["normalized"]["posicao_organograma"] {
  const c = norm(cargo);
  if (c.includes("GERENTE GERAL")) return "gerente_unidade";
  if (c.includes("ENCARREGADO") || c.includes("SUBGERENTE")) return "encarregado";
  if (c.includes("GERENTE")) return "gerente_unidade";
  return "colaborador";
}

/**
 * Setor é livre por unit_kind, casado com nomes em unit_sector_templates.
 * Retorna o nome canônico do setor para a unidade ou string vazia se não se aplica.
 */
export function inferSetorByKind(cargo: string, kind: UnitKind | null): string {
  const c = norm(cargo);
  if (!kind) return "";

  // Gerência geral / RH / financeiro não têm setor
  if (c.includes("GERENTE GERAL")) return "";

  if (kind === "cp") {
    if (/PAO FRANCES/.test(c)) return "Pão Francês";
    if (/ACOUGUEIRO\/PADEIRO/.test(c)) return "Pão Francês";
    if (c === "PADEIRO" || /^PADEIRO\b/.test(c)) return "Pão Francês";
    if (/PAO EMBALADO/.test(c)) return "Pão Embalado";
    if (/AUX\.?\s*PRODUCAO|AUXILIAR DE PRODUCAO/.test(c)) return "Pão Embalado";
    if (/COZINHEIRO|AUX\.?\s*(DE\s*)?COZINHA/.test(c)) return "Cozinha";
    if (/SALGADEIRO|SALGADO/.test(c)) return "Salgado";
    if (/CONFEITEIRO|CONFEITARIA/.test(c)) return "Confeitaria";
    if (/MOTORISTA|SERVICOS GERAIS|AUX\.?\s*LIMPEZA/.test(c)) return "Apoio/Logística";
    if (/ENCARREGADO DE PRODUCAO/.test(c)) return "";
    return "Apoio/Logística";
  }

  if (kind === "cd") {
    if (/COMPRADOR|AUX\.?\s*COMPRAS|FATURISTA|GERENTE RH|(^|\s)RH(\s|$)|(^|\s)DP(\s|$)|FINANCEIRO/.test(c)) return "Administrativo";
    if (/CONFERENTE|ESTOQUISTA|ENCARREGADO DE LOGISTICA|ENCARREGADO DE HORTIFRUTI|MOTORISTA|AUX\.?\s*PERECIVEIS/.test(c)) return "Operacional";
    return "Operacional";
  }

  if (kind === "loja") {
    if (/SUSHIMAN|ATENDIMENTO AO CLIENTE/.test(c)) return "Sushi/Atendimento";
    if (/ACOUGUEIRO|BALCONISTA DE ACOUGUE|ACOUGUE/.test(c)) return "Açougue";
    if (/PADEIRO|ATENDENTE PADARIA|PADARIA/.test(c)) return "Padaria";
    if (/OPERADOR\s*(DE)?\s*CAIXA|FISCAL\s*(DE)?\s*CAIXA|EMPACOTADOR/.test(c)) return "Frente de Caixa";
    if (/REPOSITOR|AUX\.?\s*HORTIFRUTI|HORTIFRUTI|ATENDENTE\s*(DE)?\s*LOJA/.test(c)) return "Repositores";
    if (/MONITOR\s*(DE)?\s*PREVENCAO|PREVENCAO/.test(c)) return "Prevenção";
    if (/CONFERENTE|FATURISTA|RECEBIMENTO|PERDAS/.test(c)) return "Recebimento e Perdas";
    if (/FISCAL\s*DE\s*PATRIMONIO|VIGIA|VIGILANTE/.test(c)) return "Vigia";
    if (/AUX\.?\s*LIMPEZA|SERVICOS GERAIS|MANUTENCAO|LIMPEZA/.test(c)) return "Manutenção e Limpeza";
    return "";
  }

  if (kind === "cpa") {
    if (/ACOUGUEIRO|BALCONISTA DE ACOUGUE|ACOUGUE/.test(c)) return "Açougue";
    if (/PADEIRO|ATENDENTE PADARIA|PADARIA/.test(c)) return "Padaria";
    if (/OPERADOR\s*(DE)?\s*CAIXA|FISCAL\s*(DE)?\s*CAIXA|EMPACOTADOR/.test(c)) return "Frente de Caixa";
    if (/REPOSITOR|AUX\.?\s*HORTIFRUTI|HORTIFRUTI|ATENDENTE\s*(DE)?\s*LOJA/.test(c)) return "Repositores e Hortifruti";
    if (/CONFERENTE|FATURISTA|RECEBIMENTO|PERDAS/.test(c)) return "Recebimento e Perdas";
    if (/FISCAL\s*DE\s*PATRIMONIO|VIGIA|VIGILANTE|AUX\.?\s*LIMPEZA|SERVICOS GERAIS|LIMPEZA/.test(c)) return "Vigia e Limpeza";
    return "";
  }

  if (kind === "adm") {
    if (/DIRETOR|PRESIDENT/.test(c)) return "Diretoria";
    if (/FINANCEIRO|CONTROLLER|CONTABIL|FATURISTA/.test(c)) return "Financeiro";
    if (/(^|\s)RH(\s|$)|RECURSOS HUMANOS|DEPARTAMENTO PESSOAL|(^|\s)DP(\s|$)/.test(c)) return "Recursos Humanos";
    if (/(^|\s)TI(\s|$)|TECNOLOGIA|ANALISTA TI|DESENVOLVEDOR|SISTEMAS/.test(c)) return "Tecnologia";
    return "Recursos Humanos";
  }

  return "";
}

/** Backwards-compat fallback used until we have unit_kind. */
export function inferSetorOrganograma(cargo: string): string {
  const c = norm(cargo);
  if (/PADEIRO|PADARIA/.test(c)) return "Padaria";
  if (/ACOUGUEIRO|ACOUGUE/.test(c)) return "Açougue";
  if (/OPERADOR DE CAIXA|FISCAL DE CAIXA|EMPACOTADOR/.test(c)) return "Frente de Caixa";
  if (/REPOSITOR|HORTIFRUTI/.test(c)) return "Repositores";
  if (/CONFERENTE|FATURISTA|ESTOQUISTA/.test(c)) return "Recebimento e Perdas";
  if (/LIMPEZA|SERVICOS GERAIS/.test(c)) return "Manutenção e Limpeza";
  if (/PREVENCAO/.test(c)) return "Prevenção";
  if (/VIGIA|FISCAL DE PATRIMONIO/.test(c)) return "Vigia";
  return "";
}

function parseDateBr(input: any): string | null {
  if (!input) return null;
  const s = String(input).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (br) {
    const d = br[1].padStart(2, "0");
    const m = br[2].padStart(2, "0");
    let y = br[3];
    if (y.length === 2) y = (parseInt(y) > 50 ? "19" : "20") + y;
    return `${y}-${m}-${d}`;
  }
  const n = Number(s);
  if (Number.isFinite(n) && n > 20000 && n < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

export type UnitLookup = { id: string; name: string; code: string | null; unit_kind?: UnitKind | null };

export function validateRow(
  raw: RawRow,
  index: number,
  units: UnitLookup[],
  existingCpfs: Set<string>,
  cpfsThisFile: Map<string, number>,
): ValidatedRow {
  const reasons: string[] = [];
  const r: any = {};
  for (const k of Object.keys(raw)) r[mapHeader(k)] = raw[k];

  const nome = String(r.nome ?? "").trim();
  const cpfRaw = String(r.cpf ?? "");
  const cpf = normalizeCpf(cpfRaw);
  const unidadeInput = String(r.unidade ?? r.cod_unidade ?? "").trim();
  const cargo = String(r.cargo ?? "").trim();

  const role = inferRole(cargo);
  const isGM = inferIsGeneralManager(cargo);
  const posicao = inferPosicaoOrganograma(cargo);

  // Unit resolution
  const unitsByName = new Map(units.map((u) => [norm(u.name), u]));
  const unitsByCode = new Map(units.map((u) => [norm(u.code ?? ""), u]));
  let unit: UnitLookup | null = null;
  const inputN = norm(unidadeInput);
  if (inputN) {
    unit = unitsByName.get(inputN) ?? unitsByCode.get(inputN) ?? null;
    if (!unit) {
      unit = units.find((u) => norm(u.name).includes(inputN) || inputN.includes(norm(u.name))) ?? null;
    }
  }
  // Force ADM for RH / DP / financeiro / TI
  if (role === "gerente_adm") {
    const adm = units.find((u) => u.unit_kind === "adm" || norm(u.code ?? "") === "CENTRAL_ADM" || norm(u.name).includes("CENTRAL ADMIN"));
    if (adm) unit = adm;
  }

  const kind = (unit?.unit_kind ?? null) as UnitKind | null;
  const setorOrg = inferSetorByKind(cargo, kind) || (kind ? "" : inferSetorOrganograma(cargo));

  if (!nome || nome.length < 3) reasons.push("Nome obrigatório (min 3 chars)");
  if (!cpf) reasons.push("CPF vazio");
  else if (cpf.length !== 11) reasons.push("CPF inválido (deve ter 11 dígitos)");
  else if (!isValidCpf(cpf)) reasons.push("CPF com dígito verificador inválido");
  else if (existingCpfs.has(cpf)) reasons.push("CPF já cadastrado");
  else if ((cpfsThisFile.get(cpf) ?? 0) > 1) reasons.push("CPF duplicado nesta planilha");

  if (!unit) reasons.push(`Unidade não encontrada: "${unidadeInput || "(vazio)"}"`);

  let status: ValidatedRow["status"] = "ok";
  if (reasons.some((r) => r.toLowerCase().includes("cpf") || r.toLowerCase().includes("nome") || r.toLowerCase().includes("unidade")))
    status = "erro";
  else if (!cargo) {
    reasons.push("Cargo vazio - será criado como colaborador");
    status = "aviso";
  } else if (posicao === "colaborador" && !setorOrg && kind) {
    reasons.push("Setor não inferido - revise antes de importar");
    status = "aviso";
  }

  return {
    index,
    raw,
    status,
    reasons,
    normalized: {
      cpf,
      nome,
      unidade_input: unidadeInput,
      unit_id: unit?.id ?? null,
      unit_name: unit?.name ?? null,
      unit_kind: kind,
      setor: r.setor ? String(r.setor) : null,
      cargo: cargo || null,
      role,
      posicao_organograma: posicao,
      is_general_manager: isGM,
      setor_organograma: setorOrg,
      codigo_empregado: r.codigo_empregado ? String(r.codigo_empregado) : null,
      pis: r.pis ? String(r.pis) : null,
      cbo: r.cbo ? String(r.cbo) : null,
      pcd_flag: r.pcd ? norm(r.pcd) === "PCD" : false,
      afastado_status: r.afastado ? String(r.afastado) : null,
      admissao_date: parseDateBr(r.admissao),
      nascimento_date: parseDateBr(r.nascimento),
      sexo: r.sexo ? norm(r.sexo) : null,
      periodo: r.periodo ? norm(r.periodo) : null,
    },
  };
}
