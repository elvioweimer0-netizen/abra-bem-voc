import { useStoryViewers } from "@/hooks/useStories";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function StoryViewersList({ storyId, onClose }: { storyId: string; onClose: () => void }) {
  const { data } = useStoryViewers(storyId);
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{data?.length ?? 0} visualizações</SheetTitle>
        </SheetHeader>
        <ul className="mt-4 space-y-3">
          {(data ?? []).map((v: any) => (
            <li key={v.viewer_user_id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-bold">
                {v.profile?.nome?.charAt(0) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{v.profile?.nome ?? "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{v.profile?.cargo_titulo ?? ""}</div>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(v.viewed_at), { locale: ptBR, addSuffix: true })}
              </span>
            </li>
          ))}
          {!data?.length && <li className="text-sm text-muted-foreground">Ninguém viu ainda.</li>}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
