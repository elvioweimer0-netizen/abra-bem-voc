import { useEffect, useRef, useState } from "react";
import { useSignedPhotoUrl } from "@/hooks/useAuditoriaVisual";
import { ImageOff } from "lucide-react";

export function LazyPhoto({
  path,
  alt,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [visible]);

  const { data: url, isLoading } = useSignedPhotoUrl(path, visible);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-muted ${className ?? ""}`}>
      {!path && (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageOff className="h-6 w-6" />
        </div>
      )}
      {path && (!visible || isLoading) && <div className="h-full w-full animate-pulse bg-muted" />}
      {visible && url && (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
