import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";

export function FloatingBoButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isEncarregado, isGerente, isLeadershipPanel } = useRole();
  const visible = isEncarregado || isGerente || isLeadershipPanel;
  if (!visible || location.pathname === "/bo-eletronico") return null;
  return <Button className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 h-14 w-14 rounded-full p-0 shadow-lg md:bottom-6" onClick={() => navigate("/bo-eletronico")} aria-label="Novo B.O."><Plus className="h-7 w-7" /></Button>;
}
