import { useAdminAllStories, useDeleteStory, type Story } from "@/hooks/useStories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminStories() {
  const { data, isLoading } = useAdminAllStories();
  const del = useDeleteStory();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Moderação de stories</h1>
        <p className="text-sm text-muted-foreground">Últimos 200 stories.</p>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(data ?? []).map((s: Story) => (
          <Card key={s.id} className="overflow-hidden">
            <div className="aspect-[9/16] bg-black">
              {s.media_type === "image" ? (
                <img src={s.signed_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <video src={s.signed_url} className="w-full h-full object-cover" />
              )}
            </div>
            <CardContent className="p-2 space-y-1">
              <div className="text-xs font-semibold truncate">{s.author?.nome ?? "—"}</div>
              <div className="text-[11px] text-muted-foreground truncate">{s.unit?.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {format(new Date(s.created_at), "dd/MM HH:mm", { locale: ptBR })}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => del.mutate(s)}
                className="w-full text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Remover
              </Button>
            </CardContent>
          </Card>
        ))}
        {!isLoading && !data?.length && (
          <p className="col-span-full text-sm text-muted-foreground">Sem stories.</p>
        )}
      </div>
    </div>
  );
}
