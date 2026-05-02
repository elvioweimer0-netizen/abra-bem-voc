import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

function getPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  });
}

export function IniciarVisitaButton({ unitId, unitName, onStarted }: { unitId: string; unitName: string; onStarted?: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!user) return;
    setLoading(true);

    // 1) Find supervisor template
    const { data: tpl } = await db
      .from("checklist_templates")
      .select("id")
      .eq("active", true)
      .eq("period", "visita_supervisor")
      .maybeSingle();

    if (!tpl) {
      toast({ title: "Template de visita não encontrado", variant: "destructive" });
      setLoading(false);
      return;
    }

    // 2) GPS (best-effort)
    const pos = await getPosition();
    if (!pos) {
      toast({ title: "Visita sem localização", description: "Não foi possível capturar GPS — registrando mesmo assim." });
    }

    // 3) Create completion
    const today = new Date().toISOString().slice(0, 10);
    const { data: completion, error: cErr } = await db
      .from("checklist_completions")
      .upsert(
        {
          template_id: tpl.id,
          user_id: user.id,
          unit_id: unitId,
          data: today,
          status: "pendente",
        },
        { onConflict: "template_id,user_id,unit_id,data" },
      )
      .select("id")
      .single();
    if (cErr || !completion) {
      toast({ title: "Erro ao criar checklist", description: cErr?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // 4) Create visit
    const { data: visit, error: vErr } = await db
      .from("visit_check_ins")
      .insert({
        user_id: user.id,
        unit_id: unitId,
        completion_id: completion.id,
        latitude: pos?.coords.latitude ?? null,
        longitude: pos?.coords.longitude ?? null,
      })
      .select("id")
      .single();

    if (vErr || !visit) {
      const msg = vErr?.message || "";
      if (msg.includes("row-level security")) {
        toast({ title: "Você já tem uma visita aberta", description: "Encerre a visita atual antes de iniciar outra.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao iniciar visita", description: msg, variant: "destructive" });
      }
      setLoading(false);
      return;
    }

    toast({ title: `Visita iniciada em ${unitName}` });
    onStarted?.();
    navigate(`/checklist-diario?completion=${completion.id}&visita=${visit.id}`);
  };

  return (
    <Button onClick={start} disabled={loading} className="w-full min-h-12 gap-2">
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
      Iniciar visita aqui
    </Button>
  );
}
