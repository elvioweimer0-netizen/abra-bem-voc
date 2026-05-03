import { useState } from "react";
import { Plus } from "lucide-react";
import { useActiveStories } from "@/hooks/useStories";
import { useRole } from "@/hooks/useRole";
import { StoryViewer } from "./StoryViewer";
import { StoryComposer } from "./StoryComposer";
import { cn } from "@/lib/utils";

export function StoriesBar() {
  const { data: groups } = useActiveStories();
  const { isLider } = useRole();
  const [openGroupIdx, setOpenGroupIdx] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {isLider && (
          <button
            onClick={() => setComposerOpen(true)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/60 bg-primary/5 flex items-center justify-center text-primary">
              <Plus className="w-7 h-7" />
            </div>
            <span className="text-[11px] text-muted-foreground max-w-[68px] truncate">+ Story</span>
          </button>
        )}
        {(groups ?? []).map((g, i) => (
          <button
            key={g.unit_id}
            onClick={() => setOpenGroupIdx(i)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div
              className={cn(
                "w-16 h-16 rounded-full p-[2px]",
                g.has_unseen
                  ? "bg-gradient-to-tr from-red-500 via-orange-500 to-yellow-400"
                  : "bg-muted"
              )}
            >
              <div className="w-full h-full rounded-full bg-background p-[2px]">
                <div className="w-full h-full rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-bold text-foreground">
                  {g.unit_code?.slice(0, 3) || g.unit_name.slice(0, 2)}
                </div>
              </div>
            </div>
            <span className="text-[11px] text-foreground max-w-[68px] truncate">{g.unit_name}</span>
          </button>
        ))}
      </div>

      {openGroupIdx !== null && groups?.[openGroupIdx] && (
        <StoryViewer
          stories={groups[openGroupIdx].stories}
          onClose={() => setOpenGroupIdx(null)}
          onNextGroup={() => setOpenGroupIdx((idx) => (idx !== null && idx + 1 < (groups?.length ?? 0) ? idx + 1 : null))}
        />
      )}

      {composerOpen && <StoryComposer onClose={() => setComposerOpen(false)} />}
    </div>
  );
}
