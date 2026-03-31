import { Heart, Star, ShieldCheck, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Section {
  icon: typeof Heart;
  title: string;
  text?: string;
  items?: string[];
  accent: string;
  highlight?: boolean;
}

const sections: Section[] = [
  {
    icon: Heart,
    title: "Missão",
    text: "Existimos para proporcionar às pessoas uma experiência única, dentro de um ambiente acolhedor, que entrega qualidade e satisfação.",
    accent: "from-rose-500/15 via-red-500/10 to-transparent",
    highlight: true,
  },
  {
    icon: Star,
    title: "Visão",
    text: "Ser destaque e referência como uma das melhores opções de supermercado no Estado de Mato Grosso, com postura empreendedora e garantia da sustentabilidade financeira do negócio supermercadista.",
    accent: "from-amber-500/15 via-yellow-500/10 to-transparent",
  },
  {
    icon: ShieldCheck,
    title: "Valores",
    accent: "from-emerald-500/15 via-green-500/10 to-transparent",
    items: [
      "Nosso espírito empreendedor é alimentado pela paixão em oferecer o melhor a todos que se relacionam com a nossa marca.",
      "Nosso esforço é focado em ações que surpreendem.",
      "Trabalhamos com honestidade, dedicação e comprometimento.",
      "Priorizamos o bom relacionamento com nossos colaboradores que acreditam na família Curió.",
      "Valorizamos e estimulamos atitudes éticas, proativas e gentis.",
    ],
  },
];

export function MissaoVisaoValores() {
  return (
    <section className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 rounded-full bg-primary" />
          <h2 className="text-lg font-bold text-foreground">Essência Curió</h2>
        </div>
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Cultura Curió
              </span>
              <h3 className="text-xl font-bold text-foreground">
                Jeito Curió de Ser
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Conheça os princípios que fortalecem nossa cultura, nosso atendimento
                e a forma como cuidamos das pessoas todos os dias.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              Família Curió
            </span>
            <span className="text-xs text-muted-foreground">
              Acolhimento, qualidade e compromisso
            </span>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Card
              key={section.title}
              className="group relative overflow-hidden border border-primary/10 bg-card hover:shadow-lg transition-all duration-300"
            >
              {/* Accent gradient bar */}
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${section.accent}`} />

              <CardContent className="p-5 space-y-4 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-foreground">
                        {section.title}
                      </h4>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        Essência institucional
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                </div>

                {/* Text content */}
                {section.text && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {section.text}
                  </p>
                )}

                {/* List items */}
                {section.items && (
                  <ul className="space-y-2">
                    {section.items.map((item, index) => (
                      <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                        <span className="text-primary mt-0.5 shrink-0 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Highlight quote */}
                {section.highlight && (
                  <div className="mt-3 pt-3 border-t border-primary/10">
                    <p className="text-xs italic text-primary/80 font-medium">
                      Nosso propósito começa no cuidado com as pessoas.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
