import { useEffect, useState } from "react";

/**
 * Splash screen mostrada apenas em modo standalone (PWA instalado).
 * Fundo vermelho Curió + lockup vermelho centralizado, fade-out após 800ms.
 */
export function PwaSplash() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS
      // @ts-ignore
      window.navigator.standalone === true;
    if (!isStandalone) return false;
    // Mostrar só uma vez por sessão
    const shown = sessionStorage.getItem("curio-splash-shown");
    return !shown;
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    sessionStorage.setItem("curio-splash-shown", "1");
    const t1 = window.setTimeout(() => setFading(true), 600);
    const t2 = window.setTimeout(() => setVisible(false), 1000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-400 ${fading ? "opacity-0" : "opacity-100"}`}
      style={{ backgroundColor: "#B63533" }}
      aria-hidden="true"
    >
      <img
        src="/logos/conecta_lockup/conecta_curio_splash_vermelho.png"
        alt=""
        className="max-h-[60vh] max-w-[80vw] object-contain"
      />
    </div>
  );
}
