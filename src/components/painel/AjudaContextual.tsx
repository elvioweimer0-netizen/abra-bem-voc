import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { PAINEL_HELP } from "@/lib/painel-help";

export function AjudaContextual({ helpKey }: { helpKey: string }) {
  const entry = PAINEL_HELP[helpKey];
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  if (!entry) return null;

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          aria-label="Ajuda"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          className="text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader><SheetTitle>{entry.titulo}</SheetTitle></SheetHeader>
            <div className="space-y-3 mt-3 text-sm">
              <div><strong>O que é:</strong> {entry.oque}</div>
              <div><strong>Como é calculado:</strong> {entry.comoCalcula}</div>
              <div><strong>O que fazer:</strong> {entry.oqueFazer}</div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label="Ajuda" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-semibold">{entry.titulo}</p>
        <p className="text-xs mt-1">{entry.oque}</p>
        <p className="text-xs mt-1 opacity-80">→ {entry.oqueFazer}</p>
      </TooltipContent>
    </Tooltip>
  );
}
