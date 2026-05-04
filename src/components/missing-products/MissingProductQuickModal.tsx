import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCreateMissingProduct } from "@/hooks/useCreateMissingProduct";
import { useSearchMissingProducts } from "@/hooks/useSearchMissingProducts";
import { useUpvoteMissingProduct } from "@/hooks/useUpvoteMissingProduct";
import { useMyMissingProductVotes } from "@/hooks/useMissingProducts";
import { ThumbsUp, Sparkles } from "lucide-react";

const CATEGORIES = [
  "acougue", "padaria", "hortifruti", "mercearia", "bebidas",
  "limpeza", "higiene", "frios_laticinios", "congelados", "pet", "outros",
];

const schema = z.object({
  unit_id: z.string().uuid("Selecione uma unidade"),
  product_name: z.string().trim().min(2, "Nome muito curto").max(120),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function MissingProductQuickModal({
  open, onOpenChange, defaultUnitId,
}: { open: boolean; onOpenChange: (v: boolean) => void; defaultUnitId?: string | null }) {
  const { profile } = useAuth();
  const { data: units = [] } = useAccessibleUnits();
  const { toast } = useToast();
  const create = useCreateMissingProduct();
  const upvote = useUpvoteMissingProduct();
  const { data: myVotes } = useMyMissingProductVotes();

  const initialUnit = useMemo(
    () => defaultUnitId || (profile as any)?.unit_id || units[0]?.id || "",
    [defaultUnitId, profile, units],
  );

  const [unit_id, setUnit] = useState(initialUnit);
  const [product_name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmedNew, setConfirmedNew] = useState(false);

  useEffect(() => { if (open) { setUnit(initialUnit); setConfirmedNew(false); } }, [open, initialUnit]);

  const debouncedName = useDebounced(product_name, 300);
  const { data: matches = [] } = useSearchMissingProducts(debouncedName);
  const strongMatch = matches.find((m) => m.similarity >= 0.7);
  const hasMatches = matches.length > 0 && product_name.trim().length >= 3;

  const reset = () => {
    setName(""); setBrand(""); setCategory(""); setNotes(""); setConfirmedNew(false);
  };

  const submit = async () => {
    if (hasMatches && !confirmedNew) {
      toast({
        title: "Pedidos parecidos encontrados",
        description: "Reforce um existente ou confirme criar um novo.",
      });
      return;
    }
    const parsed = schema.safeParse({ unit_id, product_name, brand, category, notes });
    if (!parsed.success) {
      toast({ title: "Verifique os campos", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    try {
      await create.mutateAsync({
        unit_id: parsed.data.unit_id,
        product_name: parsed.data.product_name,
        brand: parsed.data.brand || null,
        category: parsed.data.category || null,
        notes: parsed.data.notes || null,
      });
      toast({ title: "Pedido registrado", description: "Compras será notificado." });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const reinforce = async (requestId: string) => {
    try {
      await upvote.mutateAsync({ requestId, voted: false });
      toast({ title: "Pedido reforçado", description: "Seu voto foi computado." });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sugerir produto faltando</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {units.length > 1 && (
            <div>
              <Label className="text-xs">Unidade</Label>
              <Select value={unit_id} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.code} — {u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs">Nome do produto *</Label>
            <Input
              value={product_name}
              onChange={(e) => { setName(e.target.value); setConfirmedNew(false); }}
              maxLength={120}
              placeholder="Ex: Leite condensado lata 395g"
            />
          </div>

          {hasMatches && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                {strongMatch ? "Já existe pedido muito parecido" : "Pedidos similares encontrados"}
              </div>
              <div className="space-y-1.5">
                {matches.map((m) => {
                  const voted = myVotes?.has(m.id);
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-2 rounded bg-background/60 px-2 py-1.5">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{m.product_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {m.brand || "sem marca"} · {m.customer_count} pedido(s) · {Math.round(m.similarity * 100)}% similar
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={voted ? "secondary" : "default"}
                        disabled={voted || upvote.isPending}
                        onClick={() => reinforce(m.id)}
                        className="gap-1 shrink-0"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        {voted ? "Já votou" : "Reforçar"}
                      </Button>
                    </div>
                  );
                })}
              </div>
              {!confirmedNew && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setConfirmedNew(true)}
                >
                  Nenhum desses — criar novo pedido
                </Button>
              )}
              {confirmedNew && (
                <Badge variant="secondary" className="text-[10px]">Criando novo pedido…</Badge>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Marca (opcional)</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={80} placeholder="Ex: Nestlé" />
            </div>
            <div>
              <Label className="text-xs">Categoria (opcional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Observação (opcional)</Label>
            <Textarea
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Quem pediu, quantos clientes, etc."
            />
            <p className="text-[10px] text-muted-foreground mt-1">{notes.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Registrando..." : "Registrar pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
