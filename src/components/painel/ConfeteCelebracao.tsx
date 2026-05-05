import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";

export function celebrate() {
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
}

export function ConfeteCelebracao({ trigger }: { trigger: boolean }) {
  const last = useRef(false);
  useEffect(() => {
    if (trigger && !last.current) celebrate();
    last.current = trigger;
  }, [trigger]);
  return null;
}
