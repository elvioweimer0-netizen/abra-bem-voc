import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function PushPermission() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    const timer = window.setTimeout(() => {
      Notification.requestPermission().catch(() => undefined);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [session]);

  return null;
}