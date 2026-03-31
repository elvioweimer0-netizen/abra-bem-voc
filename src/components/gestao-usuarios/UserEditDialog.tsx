import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RoleBadge, roleConfig } from "./RoleBadge";
import { Constants } from "@/integrations/supabase/types";
import { Shield, Building, Briefcase, Power, Network } from "lucide-react";

const UNIDADES = Constants.public.Enums.unidade_tipo;
const SETORES = Constants.public.Enums.setor_tipo;
const GERENCIAS = Constants.public.Enums.gerencia_tipo;

const setorLabels: Record<string, string> = {
  acougue: "Açougue", padaria: "Padaria", hortifruti: "Hortifruti",
  mercearia: "Mercearia", frente_de_caixa: "Frente de Caixa", deposito: "Depósito",
};

const gerenciaLabels: Record<string, string> = {
  FINANCEIRO: "Financeiro", RECURSOS_HUMANOS: "Recursos Humanos",
  DEPARTAMENTO_PESSOAL: "Depto. Pessoal", MARKETING: "Marketing",
  TI: "TI", OPERACAO: "Operação", CENTRAL_PRODUCAO: "Central Produção",
  CD: "CD", MANUTENCAO: "Manutenção",
};

export interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  cargo: string;
  unidade: string;
  setor: string | null;
  gerencia: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  callerRole: string;
}

export function UserEditDialog({ user, open, onClose, onSave, callerRole }: Props) {
  const [cargo, setCargo] = useState("");
  const [unidade, setUnidade] = useState("");
  const [setor, setSetor] = useState<string | null>(null);
  const [gerencia, setGerencia] = useState("OPERACAO");
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setCargo(user.cargo);
      setUnidade(user.unidade);
      setSetor(user.setor);
      setGerencia(user.gerencia);
      setAtivo(user.ativo);
    }
  }, [user]);

  if (!user) return null;

  const allowedRoles = Object.keys(roleConfig).filter((r) => {
    if (r === "master") return callerRole === "master";
    if (r === "admin") return callerRole === "master" || callerRole === "admin";
    if (r === "adm_departamento") return ["master", "admin"].includes(callerRole);
    if (r === "supervisor") return ["master", "admin", "adm_departamento"].includes(callerRole);
    return true;
  });

  const hasChanges =
    cargo !== user.cargo ||
    unidade !== user.unidade ||
    setor !== user.setor ||
    gerencia !== user.gerencia ||
    ativo !== user.ativo;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user.user_id, {
        ...(cargo !== user.cargo && { cargo }),
        ...(unidade !== user.unidade && { unidade }),
        ...(setor !== user.setor && { setor }),
        ...(gerencia !== user.gerencia && { gerencia }),
        ...(ativo !== user.ativo && { ativo }),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            {user.nome} · {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-sm">{user.nome}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="ml-auto">
              <RoleBadge role={user.cargo} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Perfil de Acesso
            </Label>
            <Select value={cargo} onValueChange={setCargo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allowedRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleConfig[r]?.label ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building className="h-4 w-4" /> Unidade
            </Label>
            <Select value={unidade} onValueChange={setUnidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIDADES.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Network className="h-4 w-4" /> Gerência
            </Label>
            <Select value={gerencia} onValueChange={setGerencia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GERENCIAS.map((g) => (
                  <SelectItem key={g} value={g}>{gerenciaLabels[g] ?? g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Setor
            </Label>
            <Select value={setor ?? "none"} onValueChange={(v) => setSetor(v === "none" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {SETORES.map((s) => (
                  <SelectItem key={s} value={s}>{setorLabels[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label className="flex items-center gap-2 cursor-pointer">
              <Power className="h-4 w-4" /> Usuário Ativo
            </Label>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
