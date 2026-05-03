import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Props {
  disabled?: boolean;
  processing?: boolean;
  onTranscript: (text: string) => void;
}

export function ChecklistVoiceButton({ disabled, processing, onTranscript }: Props) {
  const { toast } = useToast();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef("");

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  if (!supported) return null;

  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    finalRef.current = "";
    setFinalText("");
    setInterim("");

    recognition.onresult = (event: any) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalRef.current += transcript + " ";
        } else {
          interimText += transcript;
        }
      }
      setFinalText(finalRef.current);
      setInterim(interimText);
    };

    recognition.onerror = (event: any) => {
      console.error("SpeechRecognition error:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast({
          title: "Microfone bloqueado",
          description: "Permita o microfone nas configurações do navegador.",
          variant: "destructive",
        });
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        toast({ title: "Erro no reconhecimento", description: event.error, variant: "destructive" });
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stop = () => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {}
    }
    setListening(false);
    const text = (finalRef.current + " " + interim).trim();
    setInterim("");
    if (text) onTranscript(text);
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {!listening ? (
            <Button
              type="button"
              size="lg"
              onClick={start}
              disabled={disabled || processing}
              className="min-h-12 gap-2"
              aria-label="Iniciar preenchimento por voz"
            >
              {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
              {processing ? "Processando..." : "Preencher por voz"}
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              variant="destructive"
              onClick={stop}
              className="min-h-12 gap-2 animate-pulse"
              aria-label="Parar gravação"
            >
              <Square className="h-5 w-5" />
              Parar
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            {listening ? "Ouvindo... fale os itens cumpridos" : "Diga o que já fez e a IA marca pra você"}
          </p>
        </div>
        {(finalText || interim) && (
          <div className="mt-3 rounded-md bg-card p-3 text-sm">
            <p className="text-foreground">
              {finalText}
              <span className="text-muted-foreground italic">{interim}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
