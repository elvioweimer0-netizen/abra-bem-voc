// Vagas previstas por tipo de unidade. Usado para renderizar VacancyCard
// quando a estrutura espera alguém num cargo/setor mas profiles não tem.

export type UnitKind = "loja" | "cp" | "cd" | "central_adm";

export type ExpectedSlot = {
  cargo: "gerente_loja" | "gerente_adm" | "encarregado" | "lider_setor" | "fiscal";
  setor?: string;
  gerencia?: string;
  label: string;
};

const LOJA_SETORES = [
  { key: "acougue", label: "Açougue" },
  { key: "padaria", label: "Padaria" },
  { key: "hortifruti", label: "Hortifruti" },
  { key: "mercearia", label: "Mercearia" },
  { key: "frente_de_caixa", label: "Frente de Caixa" },
  { key: "deposito", label: "Depósito" },
];

const CP_CD_SETORES = [
  { key: "padaria", label: "Padaria" },
  { key: "acougue", label: "Açougue" },
  { key: "deposito", label: "Depósito" },
];

const ADM_GERENCIAS = [
  "RH", "Financeiro", "DP", "TI", "Manutenção", "Marketing", "Comercial", "Administrativo",
];

export function detectUnitKind(code?: string | null, type?: string | null): UnitKind {
  const c = (code || "").toUpperCase();
  if (c === "CP") return "cp";
  if (c === "CD") return "cd";
  if (c === "CENTRAL_ADM" || c === "ADM") return "central_adm";
  if (type === "central") return "central_adm";
  return "loja";
}

export function getExpectedSlots(kind: UnitKind): ExpectedSlot[] {
  if (kind === "central_adm") {
    return ADM_GERENCIAS.map((g) => ({
      cargo: "gerente_adm" as const,
      gerencia: g,
      label: `Gerente ${g}`,
    }));
  }
  const slots: ExpectedSlot[] = [
    { cargo: "gerente_loja", label: "Gerente da Unidade" },
    { cargo: "fiscal", label: "Fiscal" },
  ];
  const setores = kind === "loja" ? LOJA_SETORES : CP_CD_SETORES;
  for (const s of setores) {
    slots.push({ cargo: "encarregado", setor: s.key, label: `Encarregado de ${s.label}` });
    if (kind === "loja") {
      slots.push({ cargo: "lider_setor", setor: s.key, label: `Líder de ${s.label}` });
    }
  }
  return slots;
}

export const SETOR_LABELS: Record<string, string> = {
  acougue: "Açougue",
  padaria: "Padaria",
  hortifruti: "Hortifruti",
  mercearia: "Mercearia",
  frente_de_caixa: "Frente de Caixa",
  deposito: "Depósito",
};
