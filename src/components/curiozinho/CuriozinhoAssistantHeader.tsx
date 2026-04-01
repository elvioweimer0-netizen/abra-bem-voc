import { CuriozinhoAvatar } from "./CuriozinhoAvatar";

export function CuriozinhoAssistantHeader() {
  return (
    <div className="flex items-center gap-3">
      <CuriozinhoAvatar className="h-12 w-12" />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Curiózinho</h1>
        <p className="text-sm text-muted-foreground">
          Seu assistente do Supermercado Curió
        </p>
      </div>
    </div>
  );
}
