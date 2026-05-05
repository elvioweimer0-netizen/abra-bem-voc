import { Card, CardContent } from "@/components/ui/card";
import { Pin } from "lucide-react";
import { usePinnedItems } from "@/hooks/usePinnedItems";

export function AtalhoDoGuga() {
  const { data: items = [] } = usePinnedItems();
  if (!items.length) return null;
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Pin className="w-4 h-4" />
          <span className="text-sm font-semibold">Atalho do Guga</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {items.map((it) => (
            <a
              key={it.id}
              href={it.link ?? "#"}
              className="block p-3 rounded-lg bg-card border border-border hover:card-shadow-md transition-all"
            >
              <p className="text-sm font-semibold text-foreground">{it.title}</p>
              {it.description && <p className="text-xs text-muted-foreground mt-1">{it.description}</p>}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
