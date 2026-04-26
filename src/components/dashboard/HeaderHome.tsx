import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function HeaderHome() {
  const { profile } = useAuth();
  const [dismissedNow, setDismissedNow] = useState(false);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const firstName = profile?.nome?.split(" ")[0] ?? "";
  const firstLoginAt = profile?.first_login_at ? new Date(profile.first_login_at) : null;
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const showWelcomeBanner = Boolean(
    profile?.user_id &&
      firstLoginAt &&
      Date.now() - firstLoginAt.getTime() < sevenDaysInMs &&
      !profile?.welcome_banner_dismissed &&
      !dismissedNow,
  );

  const dismissWelcomeBanner = async () => {
    setDismissedNow(true);
    if (!profile?.user_id) return;
    await (supabase as any)
      .from("profiles")
      .update({ welcome_banner_dismissed: true })
      .eq("user_id", profile.user_id);
  };

  return (
    <div className="grid gap-3 min-[481px]:grid-cols-[minmax(0,3fr)_minmax(180px,2fr)] min-[481px]:items-center">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-[28px]">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
          <span className="capitalize">{formattedDate}</span>
        </p>
      </div>

      {showWelcomeBanner && (
        <div className="gradient-curio relative min-h-20 overflow-hidden rounded-xl p-3 shadow-lg">
          <img
            src="/images/curiozinho-frame1.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 bottom-0 h-20 w-20 object-contain opacity-15 grayscale brightness-0 invert"
          />
          <button
            type="button"
            aria-label="Fechar boas-vindas"
            onClick={dismissWelcomeBanner}
            className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground transition hover:bg-primary-foreground/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="relative z-10 pr-7">
            <p className="text-[13px] font-semibold leading-snug text-primary-foreground">
              ✨ Bem-vindo ao Curió Conecta
            </p>
            <Link
              to="/rh/codigo-etica"
              className="mt-2 inline-flex text-[11px] font-medium leading-none text-primary-foreground/70 transition hover:text-primary-foreground"
            >
              Quem é o Curió &gt;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
