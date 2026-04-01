import curiozinhoImg from "@/assets/curiozinho-avatar.png";
import { cn } from "@/lib/utils";

export function CuriozinhoAvatar({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img
      src={curiozinhoImg}
      alt="Curiózinho"
      className={cn("rounded-full object-cover", className)}
    />
  );
}
