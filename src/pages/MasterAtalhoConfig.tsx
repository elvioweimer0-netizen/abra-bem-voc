import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useMasterPinnedItems } from "@/hooks/useMasterData";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function MasterAtalhoConfig() {
  const { data: items = [] } = useMasterPinnedItems();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  async function add() {
    if (!title) return;
    const { error } = await supabase.from("master_pinned_items").insert({
      title,
      link: link || null,
      description: description || null,
      ordem: items.length,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Atalho criado");
      setTitle(""); setLink(""); setDescription("");
      qc.invalidateQueries({ queryKey: ["master_pinned"] });
    }
  }

  async function toggle(id: string, active: boolean) {
    await supabase.from("master_pinned_items").update({ active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["master_pinned"] });
  }

  async function remove(id: string) {
    await supabase.from("master_pinned_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["master_pinned"] });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Card className="rounded-xl">
        <CardHeader><CardTitle className="text-base">Novo atalho</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="Link interno (ex: /vendas)" value={link} onChange={(e) => setLink(e.target.value)} />
          <Button onClick={add}>Adicionar</Button>
        </CardContent>
      </Card>
      <Card className="rounded-xl">
        <CardHeader><CardTitle className="text-base">Atalhos atuais</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {items.length === 0 && <p className="text-sm text-muted-foreground py-2">Nenhum atalho.</p>}
          {items.map((it: any) => (
            <div key={it.id} className="flex items-center gap-3 py-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{it.title}</p>
                <p className="text-xs text-muted-foreground">{it.link}</p>
              </div>
              <Switch checked={it.active} onCheckedChange={(v) => toggle(it.id, v)} />
              <Button size="icon" variant="ghost" onClick={() => remove(it.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
