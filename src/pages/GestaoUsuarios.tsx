import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import { RoleBadge, StatusBadge, roleConfig } from "@/components/gestao-usuarios/RoleBadge";
import { UserEditDialog, type UserProfile } from "@/components/gestao-usuarios/UserEditDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, Users, Shield, UserCog, Pencil, Power, CheckSquare, X,
} from "lucide-react";
import { Constants } from "@/integrations/supabase/types";

const UNIDADES = Constants.public.Enums.unidade_tipo;
const SETORES = Constants.public.Enums.setor_tipo;
const GERENCIAS = Constants.public.Enums.gerencia_tipo;
const ALL_ROLES = Object.keys(roleConfig);

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

export default function GestaoUsuarios() {
  const { profile } = useAuth();
  const { cargo, isAdmin } = useRole();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("all");
  const [filterSetor, setFilterSetor] = useState("all");
  const [filterGerencia, setFilterGerencia] = useState("all");
  const [filterCargo, setFilterCargo] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [bulkDialog, setBulkDialog] = useState<{
    type: "cargo" | "unidade" | "setor" | "gerencia" | "status";
    value: string;
  } | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["profiles-management"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return (data as unknown as UserProfile[]) ?? [];
    },
  });

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search) {
        const q = search.toLowerCase();
        if (!u.nome.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      if (filterUnidade !== "all" && u.unidade !== filterUnidade) return false;
      if (filterSetor !== "all" && u.setor !== filterSetor) return false;
      if (filterGerencia !== "all" && u.gerencia !== filterGerencia) return false;
      if (filterCargo !== "all" && u.cargo !== filterCargo) return false;
      if (filterStatus !== "all") {
        const isAtivo = u.ativo !== false;
        if (filterStatus === "ativo" && !isAtivo) return false;
        if (filterStatus === "inativo" && isAtivo) return false;
      }
      return true;
    });
  }, [users, search, filterUnidade, filterSetor, filterGerencia, filterCargo, filterStatus]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((u) => u.user_id)));
    }
  };

  const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
    const profileUpdates: Record<string, unknown> = {};
    if (updates.cargo) profileUpdates.cargo = updates.cargo;
    if (updates.unidade) profileUpdates.unidade = updates.unidade;
    if (updates.setor !== undefined) profileUpdates.setor = updates.setor;
    if (updates.gerencia !== undefined) profileUpdates.gerencia = updates.gerencia;
    if (updates.ativo !== undefined) profileUpdates.ativo = updates.ativo;

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdates as any)
      .eq("user_id", userId);
    if (profileError) throw profileError;

    if (updates.cargo) {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: updates.cargo as any });
      if (roleError) throw roleError;
    }

    queryClient.invalidateQueries({ queryKey: ["profiles-management"] });
    toast.success("Usuário atualizado com sucesso!");
  };

  const handleBulkApply = async () => {
    if (!bulkDialog) return;
    const ids = Array.from(selectedIds);
    try {
      for (const userId of ids) {
        const updates: Partial<UserProfile> = {};
        if (bulkDialog.type === "cargo") updates.cargo = bulkDialog.value;
        if (bulkDialog.type === "unidade") updates.unidade = bulkDialog.value;
        if (bulkDialog.type === "setor")
          updates.setor = bulkDialog.value === "none" ? null : bulkDialog.value;
        if (bulkDialog.type === "gerencia") updates.gerencia = bulkDialog.value;
        if (bulkDialog.type === "status") updates.ativo = bulkDialog.value === "ativo";
        await updateUser(userId, updates);
      }
      toast.success(`${ids.length} usuário(s) atualizado(s)!`);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar usuários");
    }
    setBulkDialog(null);
  };

  const toggleStatus = async (user: UserProfile) => {
    try {
      await updateUser(user.user_id, { ativo: !user.ativo });
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar status");
    }
  };

  const bulkTypeLabel: Record<string, string> = {
    cargo: "Perfil",
    unidade: "Unidade",
    setor: "Setor",
    gerencia: "Gerência",
    status: "Status",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie acessos, perfis e vínculos dos usuários do sistema
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-success" />
            <div>
              <p className="text-2xl font-bold">{users.filter((u) => u.ativo !== false).length}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-warning" />
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => ["master", "admin", "gerente_adm"].includes(u.cargo)).length}
              </p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{users.filter((u) => u.ativo === false).length}</p>
              <p className="text-xs text-muted-foreground">Inativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Unidades</SelectItem>
                {UNIDADES.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterGerencia} onValueChange={setFilterGerencia}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Gerência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Gerências</SelectItem>
                {GERENCIAS.map((g) => (
                  <SelectItem key={g} value={g}>{gerenciaLabels[g] ?? g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSetor} onValueChange={setFilterSetor}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Setores</SelectItem>
                {SETORES.map((s) => (
                  <SelectItem key={s} value={s}>{setorLabels[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCargo} onValueChange={setFilterCargo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Perfis</SelectItem>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{roleConfig[r]?.label ?? r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedIds.size} selecionado(s)</span>
            </div>
            <div className="flex flex-wrap gap-2 ml-auto">
              <Select onValueChange={(v) => setBulkDialog({ type: "cargo", value: v })}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Alterar Perfil" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.filter((r) => {
                    if (r === "master") return cargo === "master";
                    if (r === "admin") return ["master", "admin"].includes(cargo);
                    return true;
                  }).map((r) => (
                    <SelectItem key={r} value={r}>{roleConfig[r]?.label ?? r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => setBulkDialog({ type: "unidade", value: v })}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Alterar Unidade" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => setBulkDialog({ type: "gerencia", value: v })}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Alterar Gerência" />
                </SelectTrigger>
                <SelectContent>
                  {GERENCIAS.map((g) => (
                    <SelectItem key={g} value={g}>{gerenciaLabels[g] ?? g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => setBulkDialog({ type: "setor", value: v })}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Alterar Setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {SETORES.map((s) => (
                    <SelectItem key={s} value={s}>{setorLabels[s] ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => setBulkDialog({ type: "status", value: v })}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Alterar Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativar</SelectItem>
                  <SelectItem value="inativo">Inativar</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Nenhum usuário encontrado</p>
              <p className="text-sm">Ajuste os filtros ou busca</p>
            </div>
          ) : (
            <>
            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((user) => (
                <article key={user.id} className={`rounded-xl border border-border bg-card p-4 ${selectedIds.has(user.user_id) ? "ring-2 ring-primary/30" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox checked={selectedIds.has(user.user_id)} onCheckedChange={() => toggleSelect(user.user_id)} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground">{user.nome}</h3>
                      <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2"><RoleBadge role={user.cargo} /><StatusBadge ativo={user.ativo !== false} /></div>
                      <p className="mt-3 text-xs text-muted-foreground">{user.unidade} · {gerenciaLabels[user.gerencia] ?? user.gerencia}{user.setor ? ` · ${setorLabels[user.setor] ?? user.setor}` : ""}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}><Pencil className="h-4 w-4" /> Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(user)}><Power className={`h-4 w-4 ${user.ativo !== false ? "text-success" : "text-muted-foreground"}`} /> {user.ativo !== false ? "Desativar" : "Ativar"}</Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Gerência</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id} className={selectedIds.has(user.user_id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(user.user_id)}
                          onCheckedChange={() => toggleSelect(user.user_id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                      <TableCell><RoleBadge role={user.cargo} /></TableCell>
                      <TableCell className="text-sm">{user.unidade}</TableCell>
                      <TableCell className="text-sm">{gerenciaLabels[user.gerencia] ?? user.gerencia}</TableCell>
                      <TableCell className="text-sm">
                        {user.setor ? (setorLabels[user.setor] ?? user.setor) : "—"}
                      </TableCell>
                      <TableCell><StatusBadge ativo={user.ativo !== false} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingUser(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleStatus(user)}
                          >
                            <Power className={`h-4 w-4 ${user.ativo !== false ? "text-success" : "text-muted-foreground"}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <UserEditDialog
        user={editingUser}
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={updateUser}
        callerRole={cargo}
      />

      {/* Bulk Confirmation Dialog */}
      <Dialog open={!!bulkDialog} onOpenChange={(v) => !v && setBulkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Alteração em Massa</DialogTitle>
            <DialogDescription>
              Você está prestes a alterar {bulkDialog?.type && bulkTypeLabel[bulkDialog.type]} de{" "}
              <strong>{selectedIds.size}</strong> usuário(s) para{" "}
              <strong>
                {bulkDialog?.type === "cargo"
                  ? roleConfig[bulkDialog.value]?.label ?? bulkDialog.value
                  : bulkDialog?.type === "setor" && bulkDialog.value === "none"
                  ? "Nenhum"
                  : bulkDialog?.type === "setor"
                  ? setorLabels[bulkDialog.value] ?? bulkDialog.value
                  : bulkDialog?.type === "gerencia"
                  ? gerenciaLabels[bulkDialog.value] ?? bulkDialog.value
                  : bulkDialog?.value}
              </strong>
              . Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkApply}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
