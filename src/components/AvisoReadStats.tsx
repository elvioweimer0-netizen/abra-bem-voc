import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, Users } from "lucide-react";

const db = supabase as any;

type Props = {
  avisoId: string;
  unidade: string | null;
};

type Reader = { user_id: string; read_at: string };
type Profile = { user_id: string; nome: string };

export function AvisoReadStats({ avisoId, unidade }: Props) {
  const [reads, setReads] = useState<Reader[]>([]);
  const [eligible, setEligible] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const readsQuery = db.from("aviso_reads").select("user_id, read_at").eq("aviso_id", avisoId);
      const profilesQuery = unidade
        ? db.from("profiles").select("user_id, nome").eq("ativo", true).eq("unidade", unidade)
        : db.from("profiles").select("user_id, nome").eq("ativo", true);
      const [{ data: readsData }, { data: profilesData }] = await Promise.all([readsQuery, profilesQuery]);
      setReads(readsData || []);
      setEligible((profilesData || []).filter((p: Profile) => p.user_id));
      setLoading(false);
    };
    load();
  }, [avisoId, unidade]);

  if (loading) return null;

  const readSet = new Set(reads.map((r) => r.user_id));
  const total = eligible.length;
  const readCount = eligible.filter((p) => readSet.has(p.user_id)).length;
  const pending = eligible.filter((p) => !readSet.has(p.user_id));

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{readCount} de {total} leram</span>
        </div>
        {pending.length > 0 ? (open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : null}
      </button>
      {open && pending.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto border-t border-border pt-2">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Ainda não leram:</p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {pending.map((p) => (
              <li key={p.user_id}>• {p.nome}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
