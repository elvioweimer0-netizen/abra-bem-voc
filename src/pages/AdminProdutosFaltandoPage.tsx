import { useMemo, useState } from "react";
import { useMissingProducts, useMyMissingProductVotes, type MissingProductStatus } from "@/hooks/useMissingProducts";
import { useUpvoteMissingProduct } from "@/hooks/useUpvoteMissingProduct";
import { MissingProductCard } from "@/components/missing-products/MissingProductCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";

export default function AdminProdutosFaltandoPage() {
  const [tab, setTab] = useState<MissingProductStatus | "all">("aberto");
  const { data: items = [], isLoading } = useMissingProducts({ status: tab });
  const { data: allItems = [] } = useMissingProducts({ status: "all" });
  const { data: myVotes } = useMyMissingProductVotes();
  const upvote = useUpvoteMissingProduct();
  const { toast } = useToast();

  const stats = useMemo(() => {
    const monthAgo = Date.now() - 30 * 86400 * 1000;
    return {
      aberto: allItems.filter((i) => i.status === "aberto").length,
      em_compras: allItems.filter((i) => i.status === "em_compras").length,
      adicionadoMes: allItems.filter(
        (i) => i.status === "adicionado" &&
          i.status_changed_at &&
          new Date(i.status_changed_at).getTime() > monthAgo,
      ).length,
      total: allItems.length,
    };
  }, [allItems]);

  const onToggle = async (id: string, voted: boolean) => {
    try {
      await upvote.mutateAsync({ requestId: id, voted });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Compras — Produtos faltando</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Priorizado por nº de clientes que pediram + recência.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><p className="text-[11px] text-muted-foreground">Abertos</p><p className="text-2xl font-bold">{stats.aberto}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-muted-foreground">Em compras</p><p className="text-2xl font-bold">{stats.em_compras}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-muted-foreground">Adicionados (30d)</p><p className="text-2xl font-bold">{stats.adicionadoMes}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="aberto">Abertos</TabsTrigger>
          <TabsTrigger value="em_compras">Em compras</TabsTrigger>
          <TabsTrigger value="adicionado">Adicionados</TabsTrigger>
          <TabsTrigger value="recusado">Recusados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum pedido nesse status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <MissingProductCard
              key={item.id}
              item={item}
              voted={myVotes?.has(item.id) || false}
              onToggleVote={() => onToggle(item.id, myVotes?.has(item.id) || false)}
              showAdminControls
              voteDisabled={upvote.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
