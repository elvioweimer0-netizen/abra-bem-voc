import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import type { MentorRow } from "@/hooks/useMentors";

interface Props {
  mentor: MentorRow;
  onRequest: (mentor: MentorRow) => void;
}

export function MentorCard({ mentor, onRequest }: Props) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={mentor.foto_url ?? undefined} />
            <AvatarFallback>{mentor.nome[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{mentor.nome}</p>
            <p className="text-xs text-muted-foreground truncate">
              {mentor.cargo_titulo ?? mentor.cargo} · {mentor.unidade}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {mentor.topics.map((t) => (
            <Badge key={t.id} variant="secondary" className="text-xs">
              {t.icon} {t.name}
            </Badge>
          ))}
        </div>
        <Button onClick={() => onRequest(mentor)} className="w-full" size="sm">
          <MessageCircle className="mr-2 h-4 w-4" /> Pedir conversa
        </Button>
      </CardContent>
    </Card>
  );
}
