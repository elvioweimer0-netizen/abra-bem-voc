import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hand, Plus, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

type Praise = {
  id: string;
  motivo: string;
  criado_em: string;
  unit_id: string;
  autor_id: string;
  destinatario_id: string;
  autor?: { nome: string } | null;
  destinatario?: { nome: string; unit_id: string } | null;
  unit?: { name: string; code: string } | null;
};

type TeamMember = { id: string; nome: string; unit_id: string };
type Unit = { id: string; name: string; code: string };

export default function CurioDeOuroPage() {
  const { user, profile } = useAuth();
  const { isAdmin, isMaster, isSupervisor } = useRole();
  const [praises, setPraises] = useState<Praise[]>([]);
  const [applauseCounts, setApplauseCounts] = useState<Record<string, number>>({});
  const [myApplause, setMyApplause] = useState<Set<string>>(new Set());
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [open, setOpen] = useState(false);
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [destinatarioId, setDestinatarioId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const profileAny = profile as any;
  const canSeeAllUnits = isAdmin || isMaster || isSupervisor;

  const loadFeed = async () => {
    const { data } = await db
      .from("praises")
      .select("id, motivo, criado_em, unit_id, autor_id, destinatario_id, autor:profiles!praises_autor_id_fkey(nome), destinatario:team_members!praises_destinatario_id_fkey(nome, unit_id), unit:units!praises_unit_id_fkey(name, code)")
      .eq("publico", true)
      .order("criado_em", { ascending: false })
      .limit(80);
    const list = (data as Praise[]) || [];
    setPraises(list);
    if (list.length > 0) {
      const ids = list.map((p) => p.id);
      const { data: ap } = await db.from("praise_applause").select("praise_id, user_id").in("praise_id", ids);
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      (ap || []).forEach((row: any) => {
        counts[row.praise_id] = (counts[row.praise_id] || 0) + 1;
        if (user && row.user_id === user.id) mine.add(row.praise_id);
      });
      setApplauseCounts(counts);
      setMyApplause(mine);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFeed();
  }, [user]);

  useEffect(() => {
    const loadOptions = async () => {
      const { data: unitData } = await db.from("units").select("id, name, code").eq("active", true).order("name");
      setUnits(unitData || []);
      let memberQuery = db.from("team_members").select("id, nome, unit_id").eq("active", true).order("nome");
      if (!canSeeAllUnits && profileAny?.unit_id) {
        memberQuery = memberQuery.eq("unit_id", profileAny.unit_id);
      }
      const { data: memberData } = await memberQuery;
      setMembers(memberData || []);
    };
    loadOptions();
  }, [canSeeAllUnits, profileAny?.unit_id]);

  const filtered = useMemo(() => {
    if (filterUnit === "all") return praises;
    return praises.filter((p) => p.unit_id === filterUnit);
  }, [praises, filterUnit]);

  const applaud = async (praiseId: string) => {
    if (!user || myApplause.has(praiseId)) return;
    const { error } = await db.from("praise_applause").insert({ praise_id: praiseId, user_id: user.id });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    setMyApplause((s) => new Set(s).add(praiseId));
    setApplauseCounts((c) => ({ ...c, [praiseId]: (c[praiseId] || 0) + 1 }));
  };

  const submitPraise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !destinatarioId) return;
    if (motivo.trim().length < 20) {
      toast.error("Mensagem precisa ter ao menos 20 caracteres");
      return;
    }
    if (motivo.length > 280) {
      toast.error("Mensagem com mais de 280 caracteres");
      return;
    }
    const member = members.find((m) => m.id === destinatarioId);
    if (!member) {
      toast.error("Selecione um colaborador");
      return;
    }
    setSubmitting(true);
    const { error } = await db.from("praises").insert({
      autor_id: user.id,
      destinatario_id: destinatarioId,
      unit_id: member.unit_id,
      motivo: motivo.trim(),
      categoria: "outro",
      publico: true,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Curió de Ouro enviado!");
    setMotivo("");
    setDestinatarioId("");
    setOpen(false);
    loadFeed();
  };

  return (
    <div className="space-y-5 pb-24">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Trophy className="h-6 w-6 text-amber-500" /> Mural Curió de Ouro
          </h1>
          <p className="text-sm text-muted-foreground">Reconheça quem fez a diferença hoje</p>
        </div>
        {units.length > 1 && (
          <Select value={filterUnit} onValueChange={setFilterUnit}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas unidades</SelectItem>
              {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.code}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhum elogio ainda. Seja o primeiro a dar um Curió de Ouro!</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const count = applauseCounts[p.id] || 0;
            const mine = myApplause.has(p.id);
            return (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.unit?.code || "—"}</span>
                    <span>{new Date(p.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold text-foreground">{p.autor?.nome || "—"}</span>
                    <span className="text-muted-foreground"> reconheceu </span>
                    <span className="font-semibold text-foreground">{p.destinatario?.nome || "—"}</span>
                  </p>
                  <p className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">{p.motivo}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => applaud(p.id)}
                      disabled={mine}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${mine ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                    >
                      <Hand className="h-3.5 w-3.5" />
                      {mine ? "Você aplaudiu" : "Aplaudir"}
                      {count > 0 && <span className="ml-1 font-semibold">{count}</span>}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-20 right-4 z-20 h-14 gap-2 rounded-full px-5 shadow-lg md:bottom-6"
          >
            <Plus className="h-5 w-5" /> Dar Curió de Ouro
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar Curió de Ouro</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPraise} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Para quem?</label>
              <Select value={destinatarioId} onValueChange={setDestinatarioId}>
                <SelectTrigger><SelectValue placeholder="Selecione um colaborador" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Mensagem (20–280 caracteres)</label>
              <Textarea
                rows={4}
                maxLength={280}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Conte o que essa pessoa fez de incrível..."
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">{motivo.length}/280</p>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
              Enviar Curió
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
