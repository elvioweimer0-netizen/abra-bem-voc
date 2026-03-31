import { Heart, Star, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Section {
  icon: typeof Heart;
  title: string;
  text?: string;
  items?: string[];
}

const sections: Section[] = [
  {
    icon: Heart,
    title: "Missão",
    text: "Existimos para proporcionar às pessoas uma experiência única, dentro de um ambiente acolhedor, que entrega qualidade e satisfação.",
  },
  {
    icon: Star,
    title: "Visão",
    text: "Ser destaque e referência como uma das melhores opções de supermercado no Estado de Mato Grosso. Onde é possível encontrar uma postura empreendedora juntamente com a garantia da sustentabilidade financeira do negócio supermercadista.",
  },
  {
    icon: ShieldCheck,
    title: "Valores",
    items: [
      "Nosso espírito empreendedor é alimentado pela paixão em oferecer o melhor a todos que se relacionam com a nossa marca;",
      "Nosso esforço é focado em ações que surpreendem;",
      "Trabalhamos com honestidade, dedicação e comprometimento;",
      "Priorizamos o bom relacionamento com nossos colaboradores que acreditam na família Curió;",
      "Valorizamos e estimulamos atitudes éticas, proativas e gentis.",
    ],
  },
];

export function MissaoVisaoValores() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-6 rounded-full bg-primary" />
        <h2 className="text-lg font-bold text-foreground">Essência Curió</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.title}
              className="border border-primary/10 bg-gradient-to-br from-card to-primary/[0.03] card-shadow hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">{s.title}</h3>
                </div>

                {s.text && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                )}

                {s.items && (
                  <ul className="space-y-1.5">
                    {s.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                        <span className="text-primary mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
