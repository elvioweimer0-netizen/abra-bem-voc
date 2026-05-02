import { useEffect, useRef } from "react";

type Provider = "youtube" | "vimeo" | "other";

function detect(url: string): { provider: Provider; embed: string } {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let id = u.searchParams.get("v") ?? "";
      if (u.hostname.includes("youtu.be")) id = u.pathname.replace("/", "");
      if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2];
      const embed = `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0`;
      return { provider: "youtube", embed };
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return { provider: "vimeo", embed: `https://player.vimeo.com/video/${id}` };
    }
  } catch {}
  return { provider: "other", embed: url };
}

export function VideoPlayer({ url, onEnded }: { url: string; onEnded?: () => void }) {
  const { provider, embed } = detect(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handler(e: MessageEvent) {
      // YouTube
      if (provider === "youtube" && typeof e.data === "string") {
        try {
          const data = JSON.parse(e.data);
          if (data.event === "onStateChange" && data.info === 0) onEnded?.();
        } catch {}
      }
      // Vimeo
      if (provider === "vimeo" && typeof e.data === "object" && e.data?.event === "ended") {
        onEnded?.();
      }
    }
    window.addEventListener("message", handler);

    // Subscribe YouTube events
    if (provider === "youtube" && iframeRef.current) {
      const send = () => iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening" }), "*"
      );
      const t = setTimeout(send, 800);
      return () => { clearTimeout(t); window.removeEventListener("message", handler); };
    }
    // Subscribe Vimeo events
    if (provider === "vimeo" && iframeRef.current) {
      const send = () => iframeRef.current?.contentWindow?.postMessage(
        { method: "addEventListener", value: "ended" }, "*"
      );
      const t = setTimeout(send, 800);
      return () => { clearTimeout(t); window.removeEventListener("message", handler); };
    }
    return () => window.removeEventListener("message", handler);
  }, [provider, onEnded]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        ref={iframeRef}
        src={embed}
        title="Vídeo de treinamento"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
