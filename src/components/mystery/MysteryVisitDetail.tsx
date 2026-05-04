import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMysteryVisitScores, type MysteryVisit } from "@/hooks/useMysteryVisits";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

export function MysteryVisitDetail({
  visit, open, onOpenChange,
}: { visit: MysteryVisit | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: scores = [], isLoading } = useMysteryVisitScores(visit?.id ?? null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!visit?.photos?.length) { setPhotoUrls([]); return; }
      const urls: string[] = [];
      for (const path of visit.photos) {
        const { data } = await supabase.storage
          .from("mystery-photos")
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) urls.push(data.signedUrl);
      }
      if (!cancelled) setPhotoUrls(urls);
    })();
    return () => { cancelled = true; };
  }, [visit?.id]);

  if (!visit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {visit.unit?.code} — {new Date(visit.visit_date).toLocaleDateString("pt-BR")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-base px-3 py-1">
              {visit.overall_score != null ? `${Number(visit.overall_score).toFixed(1)}/10` : "—"}
            </Badge>
            {visit.anonymous_to_team && <Badge variant="secondary">🔒 Anônima</Badge>}
          </div>

          {visit.notes && (
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-sm">{visit.notes}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-2">Notas por critério</h3>
            {isLoading ? (
              <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="space-y-2">
                {scores.map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3 rounded border p-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.criterion?.name}</p>
                      {s.comment && <p className="text-xs text-muted-foreground mt-0.5">{s.comment}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < s.score ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                      <span className="ml-1 text-xs font-semibold">{s.score}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {photoUrls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Fotos</h3>
              <div className="grid grid-cols-3 gap-2">
                {photoUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded border bg-muted">
                    <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
