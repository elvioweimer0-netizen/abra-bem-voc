import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
          <Palette className="h-5 w-5 text-primary" /> Aparência
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Escolha como o portal será exibido. "Sistema" segue a preferência do seu dispositivo.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <Button
                key={opt.value}
                type="button"
                variant={active ? "default" : "outline"}
                onClick={() => setTheme(opt.value)}
                className={cn("flex h-auto flex-col gap-1 py-3", active && "ring-2 ring-ring")}
                aria-pressed={active}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{opt.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
