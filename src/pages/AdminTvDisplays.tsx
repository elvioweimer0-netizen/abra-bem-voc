import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useTvDisplays, useCreateTvDisplay, useDeleteTvDisplay, useUpdateTvDisplay,
  useRegenerateTvToken, useTvDisplayCards, useUpsertTvCard, ALL_CARD_TYPES, type TvDisplay,
} from "@/hooks/useTvDisplays";
import { supabase } from "@/integrations/supabase/client";
import { Copy, QrCode, Eye, RefreshCw, Settings2, Trash2, Tv, Plus, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function publicUrlFor(token: string) {
  return `${window.location.origin}/tv/${token}`;
}

function useUnits() {
  return useQuery({
    queryKey: ["units-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("id, name, code").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function CreateModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [unitId, setUnitId] = useState("");
  const { data: units } = useUnits();
  const create = useCreateTvDisplay();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova TV</DialogTitle>
          <DialogDescription>Cadastre uma TV de refeitório. Token e cards padrão são gerados automaticamente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="TV Refeitório Cidade Alta" />
          </div>
          <div>
            <Label>Unidade</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
              <SelectContent>
                {(units ?? []).map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            disabled={!name || !unitId || create.isPending}
            onClick={async () => {
              try {
                const u = (units ?? []).find((x: any) => x.id === unitId);
                await create.mutateAsync({ name, unit_id: unitId, unit_code: u?.code });
                toast.success("TV criada");
                setOpen(false); setName(""); setUnitId("");
              } catch (e: any) { toast.error(e.message); }
            }}
          >Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QrModal({ display, trigger }: { display: TvDisplay; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>("");
  const url = publicUrlFor(display.display_token);
  useEffect(() => {
    if (open) QRCode.toDataURL(url, { width: 512, margin: 2 }).then(setDataUrl).catch(() => {});
  }, [open, url]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code · {display.name}</DialogTitle>
          <DialogDescription>Escaneie pelo celular do gerente e abra o link na TV.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {dataUrl && <img src={dataUrl} alt="QR" className="h-72 w-72" />}
          <code className="text-xs break-all rounded bg-muted px-3 py-2">{url}</code>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewModal({ display, trigger }: { display: TvDisplay; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const url = publicUrlFor(display.display_token);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Preview · {display.name}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
          {open && <iframe src={url} className="h-full w-full" />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CardsModal({ display, trigger }: { display: TvDisplay; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: cards = [], refetch } = useTvDisplayCards(open ? display.id : undefined);
  const upsert = useUpsertTvCard();

  const byType = useMemo(() => {
    const m = new Map(cards.map((c) => [c.card_type, c]));
    return m;
  }, [cards]);

  async function toggleEnabled(card_type: string, enabled: boolean) {
    const existing = byType.get(card_type);
    await upsert.mutateAsync({
      id: existing?.id,
      display_id: display.id,
      card_type,
      enabled,
      ordem: existing?.ordem ?? (cards.length + 1),
    });
    refetch();
  }

  async function move(card_type: string, dir: -1 | 1) {
    const sorted = [...cards].sort((a, b) => a.ordem - b.ordem);
    const i = sorted.findIndex((c) => c.card_type === card_type);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const a = sorted[i], b = sorted[j];
    await Promise.all([
      upsert.mutateAsync({ id: a.id, display_id: display.id, card_type: a.card_type, enabled: a.enabled, ordem: b.ordem, config: a.config }),
      upsert.mutateAsync({ id: b.id, display_id: display.id, card_type: b.card_type, enabled: b.enabled, ordem: a.ordem, config: b.config }),
    ]);
    refetch();
  }

  const sorted = [...ALL_CARD_TYPES].sort((a, b) => {
    const oa = byType.get(a.type)?.ordem ?? 99;
    const ob = byType.get(b.type)?.ordem ?? 99;
    return oa - ob;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cards · {display.name}</DialogTitle>
          <DialogDescription>Escolha quais conteúdos rotacionam nesta TV e a ordem de exibição.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {sorted.map((opt) => {
            const c = byType.get(opt.type);
            return (
              <div key={opt.type} className="flex items-center gap-3 rounded-lg border p-3">
                <Switch checked={c?.enabled ?? false} onCheckedChange={(v) => toggleEnabled(opt.type, v)} />
                <div className="flex-1">
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {c ? `Ordem ${c.ordem}` : "Não cadastrado"}
                  </div>
                </div>
                {c && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => move(opt.type, -1)}>↑</Button>
                    <Button size="sm" variant="ghost" onClick={() => move(opt.type, 1)}>↓</Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DisplayRow({ display }: { display: TvDisplay }) {
  const update = useUpdateTvDisplay();
  const regen = useRegenerateTvToken();
  const del = useDeleteTvDisplay();
  const url = publicUrlFor(display.display_token);

  const copy = () => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada");
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Tv className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{display.name}</h3>
              {!display.active && <Badge variant="outline">Desativada</Badge>}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{display.unit?.name ?? "—"}</div>
            <code className="mt-2 inline-block max-w-full truncate rounded bg-muted px-2 py-1 text-xs">{url}</code>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={display.active}
                onCheckedChange={(v) => update.mutateAsync({ id: display.id, patch: { active: v } })}
              />
              <span className="text-xs text-muted-foreground">Ativa</span>
            </div>
            <Button size="sm" variant="outline" onClick={copy}><Copy className="mr-1 h-4 w-4" />Copiar</Button>
            <QrModal display={display} trigger={<Button size="sm" variant="outline"><QrCode className="mr-1 h-4 w-4" />QR</Button>} />
            <PreviewModal display={display} trigger={<Button size="sm" variant="outline"><Eye className="mr-1 h-4 w-4" />Preview</Button>} />
            <CardsModal display={display} trigger={<Button size="sm" variant="outline"><Settings2 className="mr-1 h-4 w-4" />Cards</Button>} />
            <Button size="sm" variant="outline" asChild>
              <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Abrir</a>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline"><RefreshCw className="mr-1 h-4 w-4" />Regerar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Regerar token?</AlertDialogTitle>
                  <AlertDialogDescription>A URL atual deixará de funcionar imediatamente.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => { await regen.mutateAsync(display.id); toast.success("Token regerado"); }}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive"><Trash2 className="mr-1 h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir TV?</AlertDialogTitle>
                  <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => { await del.mutateAsync(display.id); toast.success("TV excluída"); }}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminTvDisplays() {
  const { data: displays = [], isLoading } = useTvDisplays();

  const grouped = useMemo(() => {
    const m = new Map<string, TvDisplay[]>();
    for (const d of displays) {
      const k = d.unit?.name ?? "Sem unidade";
      m.set(k, [...(m.get(k) ?? []), d]);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [displays]);

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">TVs de Refeitório</h1>
          <p className="text-sm text-muted-foreground">Gerencie as telas das copas e refeitórios das lojas.</p>
        </div>
        <CreateModal trigger={<Button><Plus className="mr-1 h-4 w-4" />Nova TV</Button>} />
      </div>

      <Separator />

      {isLoading ? (
        <div className="text-muted-foreground">Carregando…</div>
      ) : displays.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma TV cadastrada ainda.</CardContent></Card>
      ) : (
        grouped.map(([unitName, items]) => (
          <div key={unitName} className="space-y-3">
            <h2 className="text-lg font-semibold text-muted-foreground">{unitName}</h2>
            {items.map((d) => <DisplayRow key={d.id} display={d} />)}
          </div>
        ))
      )}
    </div>
  );
}
