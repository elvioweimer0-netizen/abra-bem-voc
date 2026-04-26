import { MessageCircle, Plus, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";

export function FloatingBoButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isEncarregado, isGerente, isLeadershipPanel } = useRole();
  const canCreateBo = isEncarregado || isGerente || isLeadershipPanel;
  const isBoPage = location.pathname === "/ocorrencias" || location.pathname === "/bo-eletronico";
  const rhUrl = "https://wa.me/5565990000000";

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-3 md:bottom-6">
      <div className="hidden flex-col items-end gap-3 md:flex">
        {canCreateBo && !isBoPage && (
          <Button className="h-14 w-14 rounded-full p-0 shadow-lg" onClick={() => navigate("/ocorrencias")} aria-label="Nova Ocorrência">
            <Plus className="h-7 w-7" />
          </Button>
        )}
        <Button asChild variant="secondary" className="h-14 w-14 rounded-full p-0 shadow-lg" aria-label="Falar com RH">
          <a href={rhUrl} target="_blank" rel="noreferrer"><MessageCircle className="h-6 w-6" /></a>
        </Button>
      </div>

      <div className="flex flex-col items-end gap-3 md:hidden">
        {open && (
          <>
            {canCreateBo && !isBoPage && (
              <Button className="h-12 gap-2 rounded-full px-4 shadow-lg" onClick={() => { setOpen(false); navigate("/ocorrencias"); }}>
                <Plus className="h-5 w-5" /> Nova Ocorrência
              </Button>
            )}
            <Button asChild variant="secondary" className="h-12 gap-2 rounded-full px-4 shadow-lg">
              <a href={rhUrl} target="_blank" rel="noreferrer"><MessageCircle className="h-5 w-5" /> Falar com RH</a>
            </Button>
          </>
        )}
        <Button className="h-14 w-14 rounded-full p-0 shadow-lg" onClick={() => setOpen((value) => !value)} aria-label="Abrir ações rápidas">
          {open ? <X className="h-6 w-6" /> : <Plus className="h-7 w-7" />}
        </Button>
      </div>
    </div>
  );
}
