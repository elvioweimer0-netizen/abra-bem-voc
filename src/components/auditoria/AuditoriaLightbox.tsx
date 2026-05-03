import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertCircle } from "lucide-react";
import { useSignedPhotoUrl, type AuditoriaRow } from "@/hooks/useAuditoriaVisual";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CobrarGerenteModal } from "./CobrarGerenteModal";

export function AuditoriaLightbox({
  row,
  onClose,
}: {
  row: AuditoriaRow | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const { data: url } = useSignedPhotoUrl(row?.foto_url ?? null, !!row);

  if (!row) return null;

  return (
    <>
      <Dialog open={!!row} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-5xl p-0">
          <div className="grid md:grid-cols-[2fr_1fr]">
            <div className="bg-black flex items-center justify-center min-h-[60vh] max-h-[85vh]">
              {url ? (
                <img src={url} alt={row.item_text} className="max-h-[85vh] w-full object-contain" />
              ) : (
                <div className="text-white/50 text-sm">Carregando…</div>
              )}
            </div>
            <div className="space-y-4 p-5">
              <div>
                <Badge className="mb-2">{row.unit_code ?? "—"} · {row.unit_name ?? ""}</Badge>
                <h3 className="text-lg font-bold">{row.item_text}</h3>
                {row.template_name && (
                  <p className="text-xs text-muted-foreground">{row.template_name}</p>
                )}
              </div>

              <div className="text-sm">
                <p className="font-medium">{row.gestor_nome ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{row.gestor_cargo ?? ""}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.completed_at
                    ? format(parseISO(row.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "—"}
                </p>
              </div>

              {row.observacao && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Observação</p>
                  <p className="whitespace-pre-line text-sm">{row.observacao}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/checklist-diario?completion=${row.completion_id}`)}
                >
                  <ExternalLink className="mr-1 h-4 w-4" /> Abrir checklist
                </Button>
                <Button variant="destructive" onClick={() => setCobrarOpen(true)}>
                  <AlertCircle className="mr-1 h-4 w-4" /> Cobrar gerente
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {cobrarOpen && (
        <CobrarGerenteModal row={row} open={cobrarOpen} onClose={() => setCobrarOpen(false)} />
      )}
    </>
  );
}
