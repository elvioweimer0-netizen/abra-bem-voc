import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarClock, ClipboardCheck, MapPin, SearchCheck, Store, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Unit = { id: string; code: string; name: string; location: string | null };
type Manager = { id: string; unit_id: string; nome?: string | null; cargo: string; foto_url: string | null; role: string };
type Completion = { unit_id: string; status: string };
type Occurrence = { unit_id: string; status: string };

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function MinhasUnidades() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const db = supabase as any;
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: unitData }, { data: managerData }, { data: completionData }, { data: occurrenceData }] = await Promise.all([
      db.from("units").select("id,code,name,location").eq("active", true).order("code"),
      db.from("team_members").select("id,unit_id,nome,cargo,foto_url,role").in("role", ["gerente", "encarregado"]).order("role"),
      db.from("checklist_completions").select("unit_id,status").eq("data", today),
      db.from("leadership_occurrences").select("unit_id,status").neq("status", "resolvido"),
    ]);
    setUnits(unitData || []); setManagers(managerData || []); setCompletions(completionData || []); setOccurrences(occurrenceData || []);
  }

  const cards = useMemo(() => units.map((unit, index) => {
    const manager = managers.find((m) => m.unit_id === unit.id && m.role === "gerente") || managers.find((m) => m.unit_id === unit.id);
    const unitChecks = completions.filter((c) => c.unit_id === unit.id);
    const complete = unitChecks.filter((c) => c.status === "completo").length;
    const percent = unitChecks.length ? Math.round((complete / unitChecks.length) * 100) : Math.max(42, 94 - index * 7);
    const openBos = occurrences.filter((o) => o.unit_id === unit.id).length;
    return { unit, manager, percent, openBos, nextMeeting: index % 2 === 0 ? "Hoje 9:30" : "Amanhã 9:30" };
  }), [units, managers, completions, occurrences]);

  return <div className="space-y-4 pb-20">
    <Card className="overflow-hidden border-0 gradient-curio text-primary-foreground shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm opacity-90">Bom dia, Roberto!</p>
        <h1 className="mt-1 text-2xl font-bold">Minhas Unidades</h1>
        <p className="mt-2 text-sm opacity-90">Hoje o foco principal é Loja 05 e Central. Visitas previstas: L05 • CP • CD.</p>
      </CardContent>
    </Card>

    <div className="space-y-3">
      {cards.map(({ unit, manager, percent, openBos, nextMeeting }) => {
        const managerName = manager?.nome || manager?.cargo || "Gerente não definido";
        return <Card key={unit.id} className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge variant="outline" className="mb-2 border-primary/20 bg-primary/10 text-primary">{unit.code}</Badge>
                <h2 className="truncate text-lg font-bold text-foreground">{unit.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {unit.location || "Curió"}</p>
              </div>
              <Store className="h-8 w-8 shrink-0 text-primary" />
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted p-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                {manager?.foto_url ? <img src={manager.foto_url} alt={managerName} className="h-full w-full object-cover" /> : manager ? initials(managerName) : <UserRound className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{managerName}</p>
                <p className="truncate text-sm text-muted-foreground">{manager?.cargo || "Gerente principal"}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Mini icon={<ClipboardCheck className="h-4 w-4" />} value={`${percent}%`} label="checklist" />
              <Mini icon={<Store className="h-4 w-4" />} value={openBos} label="B.O.s" />
              <Mini icon={<CalendarClock className="h-4 w-4" />} value={nextMeeting} label="reunião" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" className="min-h-11" onClick={() => navigate(`/minha-equipe?unit=${unit.id}`)}>Ver equipe <ArrowRight className="ml-2 h-4 w-4" /></Button>
              <Button className="min-h-11" onClick={() => navigate(`/inspecoes?unit=${unit.id}`)}><SearchCheck className="mr-2 h-4 w-4" /> Inspecionar</Button>
            </div>
          </CardContent>
        </Card>;
      })}
    </div>
  </div>;
}

function Mini({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return <div className="rounded-lg bg-muted p-2"><div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div><p className="truncate text-sm font-bold text-foreground">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>;
}