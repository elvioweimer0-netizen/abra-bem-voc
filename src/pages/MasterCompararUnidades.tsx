import { Card, CardContent } from "@/components/ui/card";

export default function MasterCompararUnidades() {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-6">
        <h1 className="text-xl font-bold mb-2">Comparar unidades</h1>
        <p className="text-sm text-muted-foreground">Selecione 2+ unidades e um KPI para comparar. Em desenvolvimento.</p>
      </CardContent>
    </Card>
  );
}
