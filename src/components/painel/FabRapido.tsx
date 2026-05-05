import { useState } from "react";
import { Plus, AlertTriangle, MessageSquarePlus, Bell, ClipboardList, PackageX, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const ACOES = [
  { label: "Incidente", icon: AlertTriangle, to: "/seguranca" },
  { label: "Reclamação", icon: MessageSquarePlus, to: "/reclamacoes" },
  { label: "Aviso", icon: Bell, to: "/avisos" },
  { label: "Ocorrência", icon: ClipboardList, to: "/checklist-diario" },
  { label: "Produto faltando", icon: PackageX, to: "/produtos-faltando" },
  { label: "Mensagem", icon: MessageCircle, to: "/chat" },
];

export function FabRapido() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ações rápidas"
        className="lg:hidden fixed right-4 bottom-20 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition"
      >
        <Plus className="w-6 h-6" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>O que você quer fazer?</SheetTitle></SheetHeader>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {ACOES.map((a) => (
              <button
                key={a.label}
                onClick={() => { setOpen(false); navigate(a.to); }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 min-h-[80px]"
              >
                <a.icon className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium text-center text-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
