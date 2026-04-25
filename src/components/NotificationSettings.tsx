import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Preferences = { important_notices: boolean; general_announcements: boolean; hr_messages: boolean };

export function NotificationSettings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>({ important_notices: true, general_announcements: true, hr_messages: true });

  useEffect(() => {
    if (!user) return;
    supabase.from("notification_preferences" as never).select("important_notices,general_announcements,hr_messages").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setPrefs(data as unknown as Preferences);
    });
  }, [user]);

  const update = async (key: keyof Preferences, value: boolean) => {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await supabase.from("notification_preferences" as never).upsert({ user_id: user.id, ...next } as never, { onConflict: "user_id" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5 text-primary" /> Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          ["important_notices", "Avisos importantes"],
          ["general_announcements", "Comunicados gerais"],
          ["hr_messages", "Mensagens do RH"],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-border p-4">
            <Label>{label}</Label>
            <Switch checked={prefs[key as keyof Preferences]} onCheckedChange={(value) => update(key as keyof Preferences, value)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}