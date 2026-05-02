import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isPreviewOrIframe } from "@/lib/pwa";

/**
 * Pede permissão de notificação ~2.5s após login e, se concedida,
 * cria uma PushSubscription no browser e faz upsert em push_subscriptions.
 *
 * Observação: o envio real de push (Edge Function + VAPID) será adicionado
 * em PR futuro. Por ora apenas armazenamos a subscription.
 */
export function PushPermission() {
  const { session, user } = useAuth();

  useEffect(() => {
    if (!session || !user || !("Notification" in window)) return;
    if (isPreviewOrIframe()) return;

    let cancelled = false;

    const askAndSubscribe = async () => {
      // Pede permissão se ainda não decidida
      if (Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch {
          return;
        }
      }
      if (Notification.permission !== "granted") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          // Sem VAPID público disponível ainda — registramos apenas se já existe.
          // Quando as chaves forem provisionadas, faremos subscribe({ applicationServerKey }).
          return;
        }
        if (cancelled) return;
        await supabase
          .from("push_subscriptions")
          .upsert(
            {
              user_id: user.id,
              endpoint: sub.endpoint,
              subscription: sub.toJSON() as any,
            },
            { onConflict: "user_id,endpoint" },
          );
      } catch (error) {
        console.warn("Push subscription falhou:", error);
      }
    };

    const timer = window.setTimeout(askAndSubscribe, 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [session, user]);

  return null;
}
