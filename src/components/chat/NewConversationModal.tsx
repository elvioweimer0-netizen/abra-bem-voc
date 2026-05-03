import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (conversationId: string) => void;
}

export function NewConversationModal({ open, onOpenChange, onCreated }: Props) {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Array<{ user_id: string; nome: string; foto_url?: string | null }>>([]);
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("user_id, nome, foto_url").eq("ativo", true).neq("user_id", profile?.user_id ?? "").order("nome").limit(200);
      setUsers((data as any[] ?? []).filter((u) => u.user_id));
    })();
  }, [open, profile?.user_id]);

  const filtered = users.filter((u) => u.nome?.toLowerCase().includes(search.toLowerCase()));

  const startDM = async (otherId: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("create_or_get_direct_chat" as any, { _other: otherId });
      if (error) throw error;
      onCreated(data as string);
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setBusy(false); }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.size === 0 || !profile?.user_id) return;
    setBusy(true);
    try {
      const { data: conv, error } = await supabase.from("chat_conversations" as any)
        .insert({ type: "group", name: groupName.trim(), created_by: profile.user_id })
        .select("id").single();
      if (error) throw error;
      const cid = (conv as any).id;
      const rows = [
        { conversation_id: cid, user_id: profile.user_id, role: "admin" },
        ...Array.from(selected).map((uid) => ({ conversation_id: cid, user_id: uid, role: "member" })),
      ];
      const { error: e2 } = await supabase.from("chat_participants" as any).insert(rows);
      if (e2) throw e2;
      onCreated(cid);
      onOpenChange(false);
      setGroupName(""); setSelected(new Set());
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nova conversa</DialogTitle></DialogHeader>
        <Tabs defaultValue="dm">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="dm">Pessoa</TabsTrigger>
            <TabsTrigger value="group">Grupo</TabsTrigger>
          </TabsList>
          <TabsContent value="dm" className="space-y-2">
            <Input placeholder="Buscar pessoa..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-72 overflow-y-auto space-y-1">
              {filtered.map((u) => (
                <button key={u.user_id} disabled={busy} onClick={() => startDM(u.user_id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden text-xs font-semibold text-primary">
                    {u.foto_url ? <img src={u.foto_url} alt="" className="h-full w-full object-cover" /> : u.nome?.[0]}
                  </div>
                  <span className="text-sm">{u.nome}</span>
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="group" className="space-y-3">
            <Input placeholder="Nome do grupo" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            <Input placeholder="Buscar pessoas..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-56 overflow-y-auto space-y-1">
              {filtered.map((u) => (
                <label key={u.user_id} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                  <Checkbox checked={selected.has(u.user_id)} onCheckedChange={(v) => {
                    setSelected((s) => { const n = new Set(s); if (v) n.add(u.user_id); else n.delete(u.user_id); return n; });
                  }} />
                  <span className="text-sm flex-1">{u.nome}</span>
                </label>
              ))}
            </div>
            <Button className="w-full" onClick={createGroup} disabled={busy || !groupName.trim() || selected.size === 0}>
              Criar grupo ({selected.size})
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
