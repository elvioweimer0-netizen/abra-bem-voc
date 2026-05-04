import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useMysteryVisits, type MysteryVisit } from "@/hooks/useMysteryVisits";
import { MysteryVisitCard } from "@/components/mystery/MysteryVisitCard";
import { MysteryVisitDetail } from "@/components/mystery/MysteryVisitDetail";
import { NovaMysteryVisitForm } from "@/components/mystery/NovaMysteryVisitForm";
import { UserSearch, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function MysteryVisitPage() {
  const { profile } = useAuth();
  const profileId = (profile as any)?.id;
  const { data: visits = [], isLoading } = useMysteryVisits({ visitorId: profileId });
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MysteryVisit | null>(null);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <UserSearch className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Cliente Misterioso</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Visite outras lojas, avalie por critério e acompanhe a operação na rede.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setOpen(true)} size="lg" className="gap-2 flex-1">
          <Plus className="h-5 w-5" />
          Nova visita
        </Button>
        <Button variant="outline" asChild>
          <Link to="/cliente-misterioso/historico">Histórico geral</Link>
        </Button>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Minhas visitas</h2>
        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : visits.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não registrou nenhuma visita.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <MysteryVisitCard key={v.id} visit={v} onOpen={() => setSelected(v)} />
            ))}
          </div>
        )}
      </div>

      <NovaMysteryVisitForm open={open} onOpenChange={setOpen} />
      <MysteryVisitDetail visit={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
}
