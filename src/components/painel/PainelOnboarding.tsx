import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const STEPS = [
  { title: "Olá!", text: "Sou o Curiozinho. Vou te mostrar seu painel rapidinho." },
  { title: "Cabeçalho", text: "Aqui você vê a saudação do dia, suas streaks e o modo do painel." },
  { title: "Seus números", text: "São perguntas em vez de gráficos: 'Vai bater meta hoje?', 'Sua nota agora'." },
  { title: "Sugestões", text: "Eu te aviso 1-3 ações concretas pra hoje. Toque em 'Fazer agora'." },
  { title: "Pronto!", text: "Pode mexer à vontade. Em qualquer dúvida, clique no '?' do widget." },
];

export function PainelOnboarding() {
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = (profile as any)?.painel_onboarding_seen;
    const localSeen = localStorage.getItem("painel_onboarding_seen") === "1";
    if (seen === false && !localSeen) setOpen(true);
  }, [profile]);

  async function finish() {
    setOpen(false);
    localStorage.setItem("painel_onboarding_seen", "1");
    if (user) {
      await (supabase as any).from("profiles").update({ painel_onboarding_seen: true }).eq("user_id", user.id);
    }
  }

  const s = STEPS[step];
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) finish(); }}>
      <DialogContent className="max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-2xl shrink-0">🦜</div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Tour rápido · {step + 1}/{STEPS.length}</p>
            <h3 className="font-bold text-foreground">{s.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{s.text}</p>
          </div>
        </div>
        <div className="flex justify-between gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={finish}>Pular tour</Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)}>Próximo</Button>
          ) : (
            <Button size="sm" onClick={finish}>Pronto!</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
