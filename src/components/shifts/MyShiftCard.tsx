import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Repeat } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MyShiftCard({ shift, onSwap }: { shift: any; onSwap: () => void }) {
  const date = parseISO(shift.shift_date);
  const statusVariant = shift.status === "folga" ? "secondary" : shift.status === "falta" ? "destructive" : "default";
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold capitalize">{format(date, "EEEE, dd/MM", { locale: ptBR })}</p>
            <Badge variant={statusVariant as any} className="text-xs">{shift.status}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{shift.shift_start.slice(0,5)}–{shift.shift_end.slice(0,5)}</span>
            {shift.units && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{shift.units.name}</span>}
            {shift.setor && <span className="capitalize">{shift.setor}</span>}
          </div>
          {shift.role_in_shift && <p className="mt-1 text-xs text-muted-foreground">{shift.role_in_shift}</p>}
        </div>
        {shift.status === "agendado" && (
          <Button size="sm" variant="outline" onClick={onSwap}><Repeat className="mr-1 h-4 w-4" />Trocar</Button>
        )}
      </CardContent>
    </Card>
  );
}
