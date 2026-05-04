import { useMyMonthlyCheckinStatus } from "@/hooks/useWellbeing";
import { useState, useEffect } from "react";
import { Heart, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "wellbeing-banner-dismissed-month";

export function MonthlyCheckinBanner() {
  const { data: done, isLoading } = useMyMonthlyCheckinStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    if (localStorage.getItem(STORAGE_KEY) === month) setDismissed(true);
  }, []);

  if (isLoading || done || dismissed) return null;

  const handleDismiss = () => {
    const month = new Date().toISOString().slice(0, 7);
    localStorage.setItem(STORAGE_KEY, month);
    setDismissed(true);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4 mb-4 relative">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
        aria-label="Dispensar"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="rounded-full bg-primary/15 p-2 shrink-0">
          <Heart className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Como você está esse mês?</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Leva 1 minuto. Anônimo e sem julgamento.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link to="/bem-estar">Fazer check-in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
