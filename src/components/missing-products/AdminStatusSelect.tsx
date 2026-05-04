import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateMissingProductStatus } from "@/hooks/useUpvoteMissingProduct";
import { useToast } from "@/hooks/use-toast";

export function AdminStatusSelect({
  id,
  status,
}: { id: string; status: "aberto" | "em_compras" | "adicionado" | "recusado" }) {
  const update = useUpdateMissingProductStatus();
  const { toast } = useToast();
  return (
    <Select
      value={status}
      onValueChange={async (v) => {
        try {
          await update.mutateAsync({ id, status: v as any });
          toast({ title: "Status atualizado" });
        } catch (e: any) {
          toast({ title: "Erro", description: e.message, variant: "destructive" });
        }
      }}
    >
      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="aberto">Aberto</SelectItem>
        <SelectItem value="em_compras">Em compras</SelectItem>
        <SelectItem value="adicionado">Adicionado ao mix</SelectItem>
        <SelectItem value="recusado">Recusado</SelectItem>
      </SelectContent>
    </Select>
  );
}
