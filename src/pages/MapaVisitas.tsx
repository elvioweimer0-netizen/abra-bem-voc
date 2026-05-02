import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";
import { makeUnitIcon, statusFromLastVisit, colorForStatus } from "@/components/visitas/UnitMarker";
import { UnitVisitsPanel } from "@/components/visitas/UnitVisitsPanel";
import { Card } from "@/components/ui/card";

const db = supabase as any;

type Unit = { id: string; code: string; name: string; latitude: number | null; longitude: number | null };
type LastVisit = { unit_id: string; check_in_at: string };

export default function MapaVisitas() {
  const { isAdmin, isSupervisor } = useRole();
  const allowed = isAdmin || isSupervisor;

  const [units, setUnits] = useState<Unit[]>([]);
  const [lastByUnit, setLastByUnit] = useState<Record<string, string>>({});
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const { data: us } = await db.from("units").select("id, code, name, latitude, longitude").eq("active", true);
      setUnits(us || []);

      const { data: visits } = await db
        .from("visit_check_ins")
        .select("unit_id, check_in_at")
        .order("check_in_at", { ascending: false })
        .limit(500);
      const map: Record<string, string> = {};
      ((visits || []) as LastVisit[]).forEach((v) => {
        if (!map[v.unit_id]) map[v.unit_id] = v.check_in_at;
      });
      setLastByUnit(map);
    })();
  }, [allowed, refreshKey]);

  const withCoords = useMemo(() => units.filter((u) => u.latitude != null && u.longitude != null), [units]);
  const withoutCoords = useMemo(() => units.filter((u) => u.latitude == null || u.longitude == null), [units]);
  const openUnit = withCoords.find((u) => u.id === openUnitId) || units.find((u) => u.id === openUnitId);

  if (!allowed) return <Navigate to="/" replace />;

  // Default center: Brazil
  const defaultCenter: [number, number] = withCoords.length
    ? [withCoords.reduce((s, u) => s + Number(u.latitude), 0) / withCoords.length, withCoords.reduce((s, u) => s + Number(u.longitude), 0) / withCoords.length]
    : [-15.78, -47.93];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Mapa de Visitação</h1>
        <p className="text-sm text-muted-foreground">Acompanhe a frequência de visitas a cada unidade.</p>
      </header>

      <div className="flex flex-wrap gap-3 text-xs">
        {(["verde", "amarelo", "vermelho", "cinza"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: colorForStatus(s) }} />
            {s === "verde" ? "≤ 3 dias" : s === "amarelo" ? "4–7 dias" : s === "vermelho" ? "8+ dias" : "Nunca visitada"}
          </span>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="h-[60vh] min-h-[420px] w-full">
          <MapContainer center={defaultCenter} zoom={withCoords.length ? 12 : 4} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {withCoords.map((u) => {
              const status = statusFromLastVisit(lastByUnit[u.id]);
              return (
                <Marker
                  key={u.id}
                  position={[Number(u.latitude), Number(u.longitude)]}
                  icon={makeUnitIcon(status)}
                  eventHandlers={{ click: () => setOpenUnitId(u.id) }}
                >
                  <Popup>
                    <strong>{u.name}</strong>
                    <br />
                    {lastByUnit[u.id] ? `Última visita: ${new Date(lastByUnit[u.id]).toLocaleDateString("pt-BR")}` : "Nunca visitada"}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </Card>

      {withoutCoords.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-foreground">Unidades sem localização cadastrada</p>
          <p className="text-xs text-muted-foreground">Cadastre latitude e longitude para que apareçam no mapa:</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-foreground">
            {withoutCoords.map((u) => <li key={u.id}>{u.name} <span className="text-muted-foreground">({u.code})</span></li>)}
          </ul>
        </Card>
      )}

      <UnitVisitsPanel
        open={!!openUnitId}
        onOpenChange={(v) => !v && setOpenUnitId(null)}
        unitId={openUnitId}
        unitName={openUnit?.name || ""}
        onVisitStarted={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
