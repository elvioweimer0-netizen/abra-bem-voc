import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function CertificadoCidadaoCurio() {
  const { profile } = useAuth();
  const share = async () => {
    const text = `Sou Cidadão Curió! Concluí o onboarding cultural 🎓`;
    if (navigator.share) {
      try { await navigator.share({ title: "Cidadão Curió", text }); } catch {}
    } else {
      navigator.clipboard.writeText(text);
    }
  };
  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
      <CardContent className="p-8 text-center space-y-4">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg animate-bounce">
          <Trophy className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Você é Cidadão Curió! 🎓</h2>
        <p className="text-sm text-muted-foreground">
          Parabéns, {profile?.nome ?? "Curió"}. Você concluiu todo o onboarding cultural.
        </p>
        <Button onClick={share} className="gap-2"><Share2 className="h-4 w-4" /> Compartilhar conquista</Button>
      </CardContent>
    </Card>
  );
}
