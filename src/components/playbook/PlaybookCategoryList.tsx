import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlaybookCategory } from "@/hooks/usePlaybook";

type Props = {
  categories: PlaybookCategory[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  counts: Record<string, number>;
  totalCount: number;
};

export function PlaybookCategoryList({ categories, selected, onSelect, counts, totalCount }: Props) {
  return (
    <div className="space-y-1">
      <Button
        variant={selected === null ? "secondary" : "ghost"}
        className={cn("w-full justify-between")}
        onClick={() => onSelect(null)}
      >
        <span>Todos</span>
        <Badge variant="outline">{totalCount}</Badge>
      </Button>
      {categories.map((c) => (
        <Button
          key={c.id}
          variant={selected === c.id ? "secondary" : "ghost"}
          className="w-full justify-between"
          onClick={() => onSelect(c.id)}
        >
          <span className="truncate">{c.name}</span>
          <Badge variant="outline">{counts[c.id] ?? 0}</Badge>
        </Button>
      ))}
    </div>
  );
}
