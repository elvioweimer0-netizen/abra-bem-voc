import { Card } from "@/components/ui/card";
import { Phone, MapPin, Heart, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const recursos = [
  {
    title: "CVV — Centro de Valorização da Vida",
    description: "Apoio emocional e prevenção do suicídio. Atendimento 24h, gratuito e sigiloso.",
    contact: "Ligue 188",
    href: "https://cvv.org.br/",
    icon: Phone,
  },
  {
    title: "CAPS — Centro de Atenção Psicossocial",
    description: "Atendimento público em saúde mental. Procure o CAPS mais próximo da sua casa.",
    contact: "Ministério da Saúde",
    href: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/caps",
    icon: MapPin,
  },
  {
    title: "UBS — Unidade Básica de Saúde",
    description: "A UBS do seu bairro pode encaminhar pra acompanhamento psicológico ou médico.",
    contact: "Procure a unidade mais próxima",
    href: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/u/ubs",
    icon: MapPin,
  },
  {
    title: "Falar com o RH",
    description: "Nossa equipe de RH está disponível pra conversar com cuidado e sigilo.",
    contact: "Acesso interno",
    href: "/central-adm/rh",
    icon: Heart,
    internal: true,
  },
];

export default function BemEstarRecursosPage() {
  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          Canais de apoio
        </h1>
        <p className="text-muted-foreground mt-1">
          Você não precisa enfrentar sozinho(a). Esses canais estão aqui pra ajudar.
        </p>
      </header>

      <div className="space-y-3">
        {recursos.map((r) => (
          <Card key={r.title} className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 shrink-0">
                <r.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground">{r.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                {r.internal ? (
                  <Link to={r.href} className="text-sm text-primary mt-2 inline-flex items-center gap-1">
                    {r.contact}
                  </Link>
                ) : (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary mt-2 inline-flex items-center gap-1"
                  >
                    {r.contact} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-muted/40 border-dashed">
        <p className="text-xs text-muted-foreground">
          Em caso de emergência médica ou risco imediato à vida, ligue <strong>192 (SAMU)</strong> ou vá ao pronto-socorro mais próximo.
        </p>
      </Card>
    </div>
  );
}
