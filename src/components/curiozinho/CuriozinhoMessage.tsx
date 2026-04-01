import { CuriozinhoAvatar } from "./CuriozinhoAvatar";

export function CuriozinhoMessage({ message }: { message: string }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0">
        <CuriozinhoAvatar className="h-8 w-8" />
      </div>
      <div className="max-w-[80%] bg-muted p-3 rounded-2xl rounded-bl-md">
        <p className="text-xs font-semibold text-primary mb-1">Curiózinho</p>
        <p className="text-sm whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
}
