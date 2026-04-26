import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaInstallPrompt() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const visits = Number(localStorage.getItem("curio-pwa-visits") || "0") + 1;
    localStorage.setItem("curio-pwa-visits", String(visits));
    const dismissed = localStorage.getItem("curio-pwa-install-dismissed") === "true";

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallPromptEvent);
      if (!dismissed) window.setTimeout(() => setVisible(true), visits >= 2 ? 1000 : 30000);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (!visible || !event) return null;

  const dismiss = () => {
    localStorage.setItem("curio-pwa-install-dismissed", "true");
    setVisible(false);
  };

  const install = async () => {
    await event.prompt();
    await event.userChoice;
    setVisible(false);
  };

  return (
    <Card className="fixed inset-x-4 bottom-[5.25rem] z-40 border-primary/20 bg-card shadow-lg md:bottom-6 md:left-auto md:right-6 md:w-96">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Instale o Conecta Curió na tela inicial</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={install}>Instalar agora</Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>Mais tarde</Button>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-10 w-10" onClick={dismiss} aria-label="Fechar">
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}