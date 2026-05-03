export type SetorKey =
  | "todos"
  | "acougue"
  | "padaria"
  | "hortifruti"
  | "mercearia"
  | "caixa"
  | "deposito"
  | "geral";

export const SETORES: { key: SetorKey; label: string; match: RegExp }[] = [
  { key: "todos", label: "Todos", match: /.*/ },
  { key: "acougue", label: "Açougue", match: /(açougue|carnes?)/i },
  { key: "padaria", label: "Padaria", match: /(padaria|panifica)/i },
  { key: "hortifruti", label: "Hortifruti", match: /(hortifruti|FLV|frutas?|legumes?|verduras?)/i },
  { key: "mercearia", label: "Mercearia", match: /(mercearia|gôndola|gondola)/i },
  { key: "caixa", label: "Frente de Caixa", match: /(caixa|frente de loja|FDL)/i },
  { key: "deposito", label: "Depósito", match: /(depósito|deposito|estoque)/i },
  { key: "geral", label: "Geral", match: /.*/ },
];

export function inferSetor(text: string): SetorKey {
  for (const s of SETORES) {
    if (s.key === "todos" || s.key === "geral") continue;
    if (s.match.test(text)) return s.key;
  }
  return "geral";
}

export function matchesSetor(text: string, setor: SetorKey) {
  if (setor === "todos") return true;
  if (setor === "geral") return inferSetor(text) === "geral";
  return SETORES.find((s) => s.key === setor)?.match.test(text) ?? false;
}
