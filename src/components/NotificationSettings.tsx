import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type DigestFrequency = "realtime" | "hourly" | "every_4h" | "daily";

type Preferences = {
  important_notices: boolean;
  general_announcements: boolean;
  hr_messages: boolean;
  group_notifications: boolean;
  digest_frequency: DigestFrequency;
};

const defaults: Preferences = {
  important_notices: true,
  general_announcements: true,
  hr_messages: true,
  group_notifications: true,
  digest_frequency: "realtime",
};

export function NotificationSettings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>(defaults);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("notification_preferences")
      .select("important_notices,general_announcements,hr_messages,group_notifications,digest_frequency")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setPrefs({ ...defaults, ...data });
      });
  }, [user]);

  const update = async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await (supabase as any)
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
  };

  const toggles: Array<[keyof Preferences, string]> = [
    ["important_notices", "Avisos importantes"],
    ["general_announcements", "Comunicados gerais"],
    ["hr_messages", "Mensagens do RH"],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" /> Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {toggles.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-border p-4">
            <Label>{label}</Label>
            <Switch
              checked={prefs[key] as boolean}
              onCheckedChange={(value) => update(key, value as never)}
            />
          </div>
        ))}

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <Label>Agrupar notificações similares</Label>
            <p className="text-xs text-muted-foreground">Une eventos do mesmo aviso/ocorrência em um só item.</p>
          </div>
          <Switch
            checked={prefs.group_notifications}
            onCheckedChange={(value) => update("group_notifications", value)}
          />
        </div>

        <div className="rounded-xl border border-border p-4">
          <Label className="mb-2 block">Frequência de notificações push</Label>
          <Select value={prefs.digest_frequency} onValueChange={(v) => update("digest_frequency", v as DigestFrequency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Tempo real</SelectItem>
              <SelectItem value="hourly">A cada hora</SelectItem>
              <SelectItem value="every_4h">A cada 4 horas</SelectItem>
              <SelectItem value="daily">Resumo diário</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            Eventos individuais chegam silenciosos (badge no sino). Resumos disparam push barulhento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
