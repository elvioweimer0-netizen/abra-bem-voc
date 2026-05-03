import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getQueue, processQueue, subscribeQueue, type PendingAction } from "@/lib/offlineQueue";

export type ConnectionStatus = "online" | "offline" | "sync";

export function useOnlineStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online");
  const [pending, setPending] = useState<PendingAction[]>([]);

  const refreshQueue = useCallback(async () => {
    setPending(await getQueue());
  }, []);

  useEffect(() => {
    refreshQueue();
    const unsub = subscribeQueue(() => { refreshQueue(); });
    return () => { unsub(); };
  }, [refreshQueue]);

  const runSync = useCallback(async () => {
    const q = await getQueue();
    if (q.length === 0) { setStatus(navigator.onLine ? "online" : "offline"); return; }
    setStatus("sync");
    await processQueue();
    await refreshQueue();
    setStatus(navigator.onLine ? "online" : "offline");
  }, [refreshQueue]);

  useEffect(() => {
    const onOnline = () => { setStatus("online"); runSync(); };
    const onOffline = () => setStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    let cancelled = false;
    const ping = async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        const { error } = await (supabase as any).from("profiles").select("id", { head: true, count: "exact" }).limit(1).abortSignal(ctrl.signal);
        clearTimeout(timer);
        if (cancelled) return;
        if (error) setStatus((s) => (s === "sync" ? s : "offline"));
        else setStatus((s) => {
          if (s === "offline") { runSync(); return "online"; }
          return s === "sync" ? s : "online";
        });
      } catch {
        if (!cancelled) setStatus((s) => (s === "sync" ? s : "offline"));
      }
    };
    const interval = setInterval(ping, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [runSync]);

  return { status, isOnline: status !== "offline", pending, forceSync: runSync, refreshQueue };
}
