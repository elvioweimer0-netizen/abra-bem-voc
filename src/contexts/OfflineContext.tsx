import { createContext, useContext, type ReactNode } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

type Ctx = ReturnType<typeof useOnlineStatus>;
const OfflineCtx = createContext<Ctx | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const value = useOnlineStatus();
  return <OfflineCtx.Provider value={value}>{children}</OfflineCtx.Provider>;
}

export function useOffline() {
  const ctx = useContext(OfflineCtx);
  if (!ctx) throw new Error("useOffline must be used within OfflineProvider");
  return ctx;
}
