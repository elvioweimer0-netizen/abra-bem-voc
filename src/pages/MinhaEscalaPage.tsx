import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMyShifts } from "@/hooks/useMyShifts";
import { useShiftSwaps, useRespondSwap } from "@/hooks/useShiftSwaps";
import { MyShiftCard } from "@/components/shifts/MyShiftCard";
import { SolicitarTrocaModal } from "@/components/shifts/SolicitarTrocaModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";

export default function MinhaEscalaPage() {
  const { user } = useAuth();
  const { data: shifts = [], isLoading } = useMyShifts(14);
  const { data: swaps = [] } = useShiftSwaps();
  const respond = useRespondSwap();
  const [swapModal, setSwapModal] = useState<{ shiftId: string; unitId: string } | null>(null);

  const incoming = (swaps as any[]).filter((s) => s.swap_with_user_id === user?.id && s.status === "aberto");

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4">
        <h1 className="text-xl font-bold">Minha Escala</h1>
        <p className="text-sm text-muted-foreground">Próximos 14 dias</p>
      </CardContent></Card>

      <Tabs defaultValue="proximos">
        <TabsList>
          <TabsTrigger value="proximos">Próximos turnos</TabsTrigger>
          <TabsTrigger value="trocas">Trocas {incoming.length > 0 && <Badge className="ml-2">{incoming.length}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="proximos" className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && shifts.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">Sem turnos agendados.</CardContent></Card>}
          {shifts.map((s: any) => (
            <MyShiftCard key={s.id} shift={s} onSwap={() => setSwapModal({ shiftId: s.id, unitId: s.unit_id })} />
          ))}
        </TabsContent>

        <TabsContent value="trocas" className="space-y-2">
          {incoming.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma troca pendente pra você.</CardContent></Card>}
          {incoming.map((s: any) => (
            <Card key={s.id}><CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">Troca em {s.shifts?.shift_date && format(parseISO(s.shifts.shift_date), "dd/MM")}</p>
                <p className="text-sm text-muted-foreground">{s.shifts?.shift_start?.slice(0,5)}–{s.shifts?.shift_end?.slice(0,5)} • {s.shifts?.setor}</p>
                {s.message && <p className="mt-2 text-sm italic">"{s.message}"</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => respond.mutate({ id: s.id, status: "recusado" })}>Recusar</Button>
                <Button size="sm" onClick={() => respond.mutate({ id: s.id, status: "aceito" })}>Aceitar</Button>
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>

      {swapModal && (
        <SolicitarTrocaModal
          open
          onOpenChange={(v) => !v && setSwapModal(null)}
          shiftId={swapModal.shiftId}
          unitId={swapModal.unitId}
        />
      )}
    </div>
  );
}
