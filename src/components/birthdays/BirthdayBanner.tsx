import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAniversariantesHoje, useBirthdayWishesFor } from "@/hooks/useBirthdays";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cake, X } from "lucide-react";

function todayKey() {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(new Date());
}

function initials(n?: string | null) {
  return (n ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

export function BirthdayBanner() {
  const { user, profile } = useAuth();
  const { data: hoje = [] } = useAniversariantesHoje();
  const isMyBirthday = !!user && hoje.some((p) => p.user_id === user.id);
  const { data: wishes = [] } = useBirthdayWishesFor(isMyBirthday ? user!.id : undefined, true);

  const storageKey = `birthday_banner_dismissed_${todayKey()}`;
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  if (!isMyBirthday || dismissed) return null;

  const firstName = profile?.nome?.split(" ")[0] ?? "Curió";
  const close = () => { window.localStorage.setItem(storageKey, "1"); setDismissed(true); };

  return (
    <div className="sticky top-0 z-30 mb-4 rounded-xl border border-rose-300 bg-gradient-to-r from-rose-100 via-amber-100 to-rose-100 p-4 shadow-md dark:from-rose-950/40 dark:via-amber-950/40 dark:to-rose-950/40">
      <div className="flex items-start gap-3">
        <Cake className="h-6 w-6 shrink-0 text-rose-600" />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-rose-900 dark:text-rose-100">🎉 Feliz aniversário, {firstName}!</h2>
          {wishes.length > 0 ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-rose-900/80 dark:text-rose-100/80">{wishes.length} {wishes.length === 1 ? "pessoa" : "pessoas"} já te parabenizaram:</span>
              <div className="flex -space-x-2">
                {wishes.slice(0, 8).map((w) => (
                  <Avatar key={w.id} className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={w.from?.foto_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">{initials(w.from?.nome)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-rose-900/80 dark:text-rose-100/80">Aguarde, mensagens dos colegas vão aparecer aqui.</p>
          )}
        </div>
        <button onClick={close} className="text-rose-700/70 hover:text-rose-900" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
