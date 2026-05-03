import { useEffect, useRef, useState } from "react";
import { X, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMarkStoryView, useReactStory, type Story } from "@/hooks/useStories";
import { StoryViewersList } from "./StoryViewersList";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const EMOJIS = ["👏", "❤️", "🎉", "👍", "🔥"];

export function StoryViewer({
  stories,
  onClose,
  onNextGroup,
}: {
  stories: Story[];
  onClose: () => void;
  onNextGroup?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewersOpen, setViewersOpen] = useState(false);
  const { profile } = useAuth();
  const markView = useMarkStoryView();
  const react = useReactStory();
  const startTouch = useRef<{ x: number; y: number } | null>(null);
  const story = stories[idx];
  const isAuthor = story?.author_user_id === profile?.user_id;
  const duration = (story?.media_type === "video" ? Math.max(story.duration_seconds || 5, 3) : 5) * 1000;

  useEffect(() => {
    if (!story) return;
    markView.mutate(story.id);
    setProgress(0);
    const start = Date.now();
    const timer = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(timer);
        if (idx + 1 < stories.length) setIdx(idx + 1);
        else onNextGroup ? onNextGroup() : onClose();
      }
    }, 50);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, story?.id]);

  if (!story) return null;

  function handleTap(e: React.MouseEvent) {
    const w = (e.currentTarget as HTMLDivElement).clientWidth;
    const x = e.nativeEvent.offsetX;
    if (x < w / 3) setIdx((i) => Math.max(0, i - 1));
    else setIdx((i) => (i + 1 < stories.length ? i + 1 : i));
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Progress bars */}
      <div className="flex gap-1 p-2">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${i < idx ? 100 : i === idx ? progress : 0}%` }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-white/20 overflow-hidden flex items-center justify-center text-sm font-bold">
            {story.author?.nome?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{story.author?.nome ?? "—"}</div>
            <div className="text-[11px] opacity-80 truncate">
              {story.author?.cargo_titulo ?? story.author?.cargo}
              {story.setor ? ` · ${story.setor}` : ""} ·{" "}
              {formatDistanceToNow(new Date(story.created_at), { locale: ptBR, addSuffix: true })}
            </div>
          </div>
        </div>
        <button onClick={onClose} aria-label="Fechar"><X className="w-6 h-6" /></button>
      </div>

      {/* Media */}
      <div
        className="flex-1 relative overflow-hidden"
        onClick={handleTap}
        onTouchStart={(e) => (startTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          if (!startTouch.current) return;
          const dy = e.changedTouches[0].clientY - startTouch.current.y;
          if (dy > 80) onClose();
          startTouch.current = null;
        }}
      >
        {story.media_type === "image" ? (
          <img src={story.signed_url} alt={story.caption ?? ""} className="w-full h-full object-contain" />
        ) : (
          <video src={story.signed_url} autoPlay playsInline className="w-full h-full object-contain" />
        )}
        {story.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4 text-white text-center text-sm bg-black/40 py-2">
            {story.caption}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 flex items-center justify-between text-white" onClick={(e) => e.stopPropagation()}>
        {isAuthor ? (
          <button className="flex items-center gap-2 text-sm" onClick={() => setViewersOpen(true)}>
            <Eye className="w-5 h-5" />
            visualizações
          </button>
        ) : (
          <div className="flex gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => react.mutate({ storyId: story.id, emoji: e })}
                className="text-2xl hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {viewersOpen && <StoryViewersList storyId={story.id} onClose={() => setViewersOpen(false)} />}
    </div>
  );
}
