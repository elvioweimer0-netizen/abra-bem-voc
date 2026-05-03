import { useBirthdayWishesFor } from "@/hooks/useBirthdays";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(n?: string | null) {
  return (n ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

export function BirthdayWishesList({ userId, dayOnly = false }: { userId: string; dayOnly?: boolean }) {
  const { data = [], isLoading } = useBirthdayWishesFor(userId, dayOnly);
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>;
  return (
    <ul className="space-y-3">
      {data.map((w) => (
        <li key={w.id} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={w.from?.foto_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials(w.from?.nome)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm"><span className="font-semibold">{w.from?.nome ?? "Alguém"}</span> <span className="text-xs text-muted-foreground">· {new Date(w.created_at).toLocaleDateString("pt-BR")}</span></p>
            <p className="text-sm text-muted-foreground">{w.message_text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
