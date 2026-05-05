import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/gestao-usuarios/RoleBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRole } from "@/hooks/useRole";
import type { OrgPerson } from "@/hooks/useUnitOrgData";
import { Mail, Phone } from "lucide-react";
import { SETOR_LABELS } from "@/config/orgExpectations";

const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

const colorFor = (n: string) => {
  const palette = ["bg-orange-200 text-orange-800", "bg-blue-200 text-blue-800", "bg-emerald-200 text-emerald-800", "bg-purple-200 text-purple-800", "bg-rose-200 text-rose-800", "bg-amber-200 text-amber-800"];
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

export function PersonCard({ person, compact = false }: { person: OrgPerson; compact?: boolean }) {
  const navigate = useNavigate();
  const { isLider } = useRole();
  const setorLabel = person.setor ? SETOR_LABELS[person.setor] ?? person.setor : null;

  const handleClick = () => {
    if (isLider && person.user_id) navigate(`/colaboradores/${person.user_id}`);
  };

  const isAfastado = !!person.afastado_status;

  const card = (
    <div
      onClick={isLider ? handleClick : undefined}
      className={`group relative inline-flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 shadow-sm transition hover:shadow-md ${isLider && person.user_id ? "cursor-pointer hover:border-primary/40" : ""} ${compact ? "min-w-[140px]" : "min-w-[170px]"}`}
    >
      {isAfastado && (
        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" title={`Afastado: ${person.afastado_status}`} />
      )}
      <Avatar className={compact ? "h-10 w-10" : "h-14 w-14"}>
        {person.foto_url ? <AvatarImage src={person.foto_url} alt={person.nome} /> : null}
        <AvatarFallback className={colorFor(person.nome)}>{initials(person.nome)}</AvatarFallback>
      </Avatar>
      <div className="text-center">
        <p className={`font-semibold leading-tight ${compact ? "text-xs" : "text-sm"}`}>{person.nome}</p>
        <div className="mt-1 flex flex-col items-center gap-1">
          <RoleBadge role={person.cargo} />
          {(person.cargo_text || setorLabel) && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground line-clamp-1">
              {person.cargo_text ?? setorLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (isLider) return card;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">{card}</div>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm">
        <p className="font-semibold">{person.nome}</p>
        <p className="text-xs text-muted-foreground">{person.cargo_titulo ?? person.cargo}</p>
        <div className="mt-2 space-y-1 text-xs">
          {person.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{person.email}</div>}
          {person.telefone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{person.telefone}</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
