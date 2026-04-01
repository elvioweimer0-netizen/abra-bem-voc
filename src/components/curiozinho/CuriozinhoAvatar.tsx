import { useState, useEffect } from "react";
import curiozinhoImg from "@/assets/curiozinho-avatar.png";
import { cn } from "@/lib/utils";

const FRAMES = [
  "/images/curiozinho-frame1.png",
  "/images/curiozinho-frame2.png",
  "/images/curiozinho-frame3.png",
  "/images/curiozinho-frame4.png",
];

export function CuriozinhoAvatar({
  className = "h-8 w-8",
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FRAMES.length);
    }, 200);
    return () => clearInterval(interval);
  }, [animated]);

  return (
    <img
      src={animated ? FRAMES[frameIndex] : curiozinhoImg}
      alt="Curiózinho"
      className={cn("rounded-full object-cover", className)}
    />
  );
}
