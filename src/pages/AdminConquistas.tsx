import { useState } from "react";
import { useAllAchievements, useToggleAchievementActive, type Achievement } from "@/hooks/useAchievements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { AchievementFormModal } from "@/components/achievements/AchievementFormModal";

export default function AdminConquistas() {
  const { data, isLoading } = useAllAchievements();
  const toggle = useToggleAchievementActive();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Conquistas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as badges disponíveis no sistema</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova
        </Button>
      </div>

      <Card className="divide-y">
        {isLoading && <div className="p-6 text-sm text-muted-foreground text-center">Carregando...</div>}
        {(data ?? []).map((a) => (
          <div key={a.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{a.name}</p>
                <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                <Badge variant="secondary" className="text-[10px]">{a.criteria_type} · {a.criteria_target}</Badge>
                <code className="text-[10px] text-muted-foreground">{a.code}</code>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>
            </div>
            <Switch checked={a.active} onCheckedChange={(v) => toggle.mutate({ id: a.id, active: v })} />
            <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Card>

      <AchievementFormModal open={open} onOpenChange={setOpen} item={editing} />
    </div>
  );
}
