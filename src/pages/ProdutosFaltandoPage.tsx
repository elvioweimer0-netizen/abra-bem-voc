import { useState } from "react";
import { useMissingProducts, useMyMissingProductVotes, type MissingProductStatus } from "@/hooks/useMissingProducts";
import { useUpvoteMissingProduct } from "@/hooks/useUpvoteMissingProduct";
import { MissingProductCard } from "@/components/missing-products/MissingProductCard";
import { MissingProductTriggerButton } from "@/components/missing-products/MissingProductTriggerButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageSearch } from "lucide-react";

export default function ProdutosFaltandoPage() {
  const [tab, setTab] = useState<MissingProductStatus | "all">("aberto");
  const { data: items = [], isLoading } = useMissingProducts({ status: tab });
  const { data: myVotes } = useMyMissingProductVotes();
  const upvote = useUpvoteMissingProduct();
  const { toast } = useToast();

  const onToggle = async (id: string, voted: boolean) => {
    try {
      await upvote.mutateAsync({ requestId: id, voted });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <PackageSearch className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Produtos faltando</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Veja o que clientes estão pedindo e reforce os produtos que sua loja precisa.
        </p>
      </div>

      <MissingProductTriggerButton variant="default" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="aberto">Abertos</TabsTrigger>
          <TabsTrigger value="em_compras">Em compras</TabsTrigger>
          <TabsTrigger value="adicionado">Adicionados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
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
              voteDisabled={upvote.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
