import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateComplaint } from "@/hooks/useCreateComplaint";
import { useAccessibleUnits } from "@/hooks/useAccessibleUnits";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { ComplaintCategory, ComplaintSeverity } from "@/hooks/useComplaints";
import { cn } from "@/lib/utils";

const SETORES = ["acougue", "padaria", "hortifruti", "mercearia", "frente_caixa", "deposito", "geral"];

const CATEGORIES: { id: ComplaintCategory; label: string; emoji: string }[] = [
  { id: "atendimento", label: "Atendimento", emoji: "💬" },
  { id: "produto", label: "Produto", emoji: "📦" },
  { id: "preco", label: "Preço", emoji: "💸" },
  { id: "fila", label: "Fila", emoji: "⏱️" },
  { id: "limpeza", label: "Limpeza", emoji: "🧼" },
  { id: "estoque", label: "Estoque", emoji: "📭" },
  { id: "outros", label: "Outros", emoji: "❓" },
];

const SEVERITIES: { id: ComplaintSeverity; label: string; tone: string }[] = [
  { id: "leve", label: "Leve", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" },
  { id: "media", label: "Média", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40" },
  { id: "grave", label: "Grave", tone: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40" },
  { id: "muito_grave", label: "Muito grave", tone: "bg-destructive/15 text-destructive border-destructive/40" },
];

const schema = z.object({
  unit_id: z.string().uuid("Selecione uma unidade"),
  category: z.enum(["atendimento","produto","preco","fila","limpeza","estoque","outros"]),
  severity: z.enum(["leve","media","grave","muito_grave"]),
  description: z.string().trim().min(10, "Descreva com ao menos 10 caracteres").max(2000),
  customer_contact: z.string().trim().max(200).optional().or(z.literal("")),
  action_taken: z.string().trim().max(1000).optional().or(z.literal("")),
  setor: z.string().optional().or(z.literal("")),
});

export function ComplaintQuickModal({
  open, onOpenChange, defaultUnitId,
}: { open: boolean; onOpenChange: (v: boolean) => void; defaultUnitId?: string | null }) {
  const { profile } = useAuth();
  const { data: units = [] } = useAccessibleUnits();
  const { toast } = useToast();
  const create = useCreateComplaint();

  const initialUnit = useMemo(
    () => defaultUnitId || (profile as any)?.unit_id || units[0]?.id || "",
    [defaultUnitId, profile, units]
  );

  const [unit_id, setUnit] = useState<string>(initialUnit);
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [severity, setSeverity] = useState<ComplaintSeverity | "">("");
  const [description, setDescription] = useState("");
  const [customer_contact, setContact] = useState("");
  const [action_taken, setAction] = useState("");
  const [setor, setSetor] = useState("");

  useEffect(() => { if (open) setUnit(initialUnit); }, [open, initialUnit]);

  const reset = () => {
    setCategory(""); setSeverity(""); setDescription("");
    setContact(""); setAction(""); setSetor("");
  };

  const submit = async () => {
    const parsed = schema.safeParse({
      unit_id, category, severity, description, customer_contact, action_taken, setor,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast({ title: "Verifique os campos", description: first?.message, variant: "destructive" });
      return;
    }
    try {
      await create.mutateAsync({
        unit_id: parsed.data.unit_id,
        category: parsed.data.category,
        severity: parsed.data.severity,
        description: parsed.data.description,
        customer_contact: parsed.data.customer_contact || null,
        action_taken: parsed.data.action_taken || null,
        setor: parsed.data.setor || null,
      });
      toast({ title: "Reclamação registrada", description: "Equipe foi notificada." });
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
          <DialogTitle>Registrar reclamação de cliente</DialogTitle>
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
            <Label className="text-xs mb-2 block">Categoria</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    category === c.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground/80 border-border hover:bg-muted"
                  )}
                >
                  <span className="mr-1">{c.emoji}</span>{c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Gravidade</Label>
            <div className="flex flex-wrap gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeverity(s.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    severity === s.id ? s.tone + " ring-2 ring-offset-1 ring-current/40" : "bg-background text-foreground/70 border-border hover:bg-muted"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Descrição *</Label>
            <Textarea
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que aconteceu? Seja objetivo."
            />
            <p className="text-[10px] text-muted-foreground mt-1">{description.length}/2000</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Setor (opcional)</Label>
              <Select value={setor} onValueChange={setSetor}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {SETORES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Contato do cliente (opcional)</Label>
              <Input
                value={customer_contact}
                onChange={(e) => setContact(e.target.value)}
                maxLength={200}
                placeholder="Nome / telefone / email"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Ação imediata tomada (opcional)</Label>
            <Textarea
              rows={2}
              maxLength={1000}
              value={action_taken}
              onChange={(e) => setAction(e.target.value)}
              placeholder="O que foi feito no momento?"
            />
          </div>

          {(severity === "grave" || severity === "muito_grave") && (
            <Badge variant="destructive" className="text-xs">
              Gerência será notificada imediatamente
            </Badge>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Registrando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
