import L from "leaflet";

export type VisitStatus = "verde" | "amarelo" | "vermelho" | "cinza";

export function statusFromLastVisit(lastIso?: string | null): VisitStatus {
  if (!lastIso) return "cinza";
  const days = Math.floor((Date.now() - new Date(lastIso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 3) return "verde";
  if (days <= 7) return "amarelo";
  return "vermelho";
}

const COLORS: Record<VisitStatus, string> = {
  verde: "#16a34a",
  amarelo: "#f59e0b",
  vermelho: "#dc2626",
  cinza: "#6b7280",
};

export function colorForStatus(s: VisitStatus) {
  return COLORS[s];
}

export function makeUnitIcon(status: VisitStatus) {
  const color = COLORS[status];
  const html = `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid white;"></div>
      <div style="position:absolute;width:10px;height:10px;border-radius:50%;background:white;"></div>
    </div>
  `;
  return L.divIcon({ html, className: "", iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });
}
