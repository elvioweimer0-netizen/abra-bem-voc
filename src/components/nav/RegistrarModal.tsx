import { createContext, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, MessageCircleWarning, ShieldAlert, PackageSearch, HandHelping, FileQuestion } from "lucide-react";

type Ctx = { open: () => void; close: () => void };
const RegistrarCtx = createContext<Ctx | null>(null);

export function RegistrarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const items = [
    { label: "Ocorrência", icon: FileQuestion, to: "/ocorrencias", color: "bg-amber-500/10 text-amber-700" },
    { label: "Reclamação de Cliente", icon: MessageCircleWarning, to: "/reclamacoes", color: "bg-orange-500/10 text-orange-700" },
    { label: "Incidente de Segurança", icon: ShieldAlert, to: "/seguranca", color: "bg-red-500/10 text-red-700" },
    { label: "Produto Faltando", icon: PackageSearch, to: "/produtos-faltando", color: "bg-blue-500/10 text-blue-700" },
    { label: "Reposição entre Lojas", icon: HandHelping, to: "/reposicao", color: "bg-green-500/10 text-green-700" },
  ];

  return (
    <RegistrarCtx.Provider value={{ open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" /> Registrar
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => { setIsOpen(false); navigate(it.to); }}
                className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-accent transition"
              >
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${it.color}`}>
                  <it.icon className="h-6 w-6" />
                </div>
                <div className="font-medium">{it.label}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </RegistrarCtx.Provider>
  );
}

export function useRegistrar() {
  const ctx = useContext(RegistrarCtx);
  if (!ctx) throw new Error("useRegistrar must be inside RegistrarProvider");
  return ctx;
}
