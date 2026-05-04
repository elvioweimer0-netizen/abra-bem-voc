import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NovaCoberturaForm } from "@/components/coverage/NovaCoberturaForm";
import { HelperCandidateCard } from "@/components/coverage/HelperCandidateCard";
import { useAvailableHelpers } from "@/hooks/useAvailableHelpers";
import { useMyCoverageRequests, type CoverageRequest } from "@/hooks/useCoverageRequests";
import { useInviteHelpers } from "@/hooks/useMyCoverageInvites";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, HandHelping } from "lucide-react";

export default function ReposicaoPage() {
  const { toast } = useToast();
  const [active, setActive] = useState<CoverageRequest | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const helpers = useAvailableHelpers(active?.target_date ?? null);
  const invite = useInviteHelpers();
  const { data: myRequests = [] } = useMyCoverageRequests();

  const handleInvite = async (helperProfileId: string) => {
    if (!active) return;
    try {
      await invite.mutateAsync({ request_id: active.id, invitee_user_ids: [helperProfileId] });
      setInvitedIds((s) => new Set(s).add(helperProfileId));
      toast({ title: "Convite enviado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <HandHelping className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Reposição entre lojas</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Solicite cobertura emergencial a colaboradores de outras unidades que se voluntariaram.
      </p>

      <NovaCoberturaForm onCreated={(r) => { setActive(r); setInvitedIds(new Set()); }} />

      {active && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-bold text-foreground">Candidatos disponíveis</h2>
            <p className="text-xs text-muted-foreground">
              Colaboradores opt-in fora da sua loja para {new Date(active.target_date).toLocaleDateString("pt-BR")}.
            </p>
            {helpers.isLoading && <p className="text-sm text-muted-foreground">Buscando...</p>}
            {!helpers.isLoading && (helpers.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum colaborador disponível para essa data.</p>
            )}
            <div className="space-y-2">
              {(helpers.data ?? []).map((h) => (
                <HelperCandidateCard
                  key={h.id}
                  helper={h}
                  invited={invitedIds.has(h.id)}
                  loading={invite.isPending}
                  onInvite={() => handleInvite(h.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-bold text-foreground">Minhas solicitações</h2>
          {myRequests.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação ainda.</p>}
          {myRequests.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-border/70 py-2 last:border-0">
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(r.target_date).toLocaleDateString("pt-BR")}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{r.target_shift_start.slice(0,5)}–{r.target_shift_end.slice(0,5)}</span>
                {r.setor && <Badge variant="outline">{r.setor}</Badge>}
              </div>
              <Badge variant={r.status === "aceito" ? "default" : r.status === "concluido" ? "secondary" : "outline"}>{r.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
