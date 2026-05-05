import { useState } from "react";
import { Volume2, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BotaoOuvirResumo({ texto }: { texto: string }) {
  const [playing, setPlaying] = useState(false);
  function toggle() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "pt-BR";
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
    setPlaying(true);
  }
  return (
    <Button variant="outline" size="sm" onClick={toggle} className="gap-1">
      {playing ? <Pause className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
      {playing ? "Pausar" : "Ouvir resumo"}
    </Button>
  );
}
