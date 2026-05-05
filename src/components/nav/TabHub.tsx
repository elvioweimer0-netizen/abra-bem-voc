import { Suspense, type ReactNode, type ComponentType, lazy } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumbs } from "./Breadcrumbs";

export type HubTab = {
  value: string;
  label: string;
  /** Lazy import factory, e.g. () => import("@/pages/Avisos") */
  load: () => Promise<{ default: ComponentType<any> }>;
  /** Visibility predicate */
  show?: boolean;
};

const cache = new Map<string, ComponentType<any>>();
function getLazy(tab: HubTab) {
  if (!cache.has(tab.value)) cache.set(tab.value, lazy(tab.load));
  return cache.get(tab.value)!;
}

export function TabHub({
  title,
  description,
  breadcrumb,
  tabs,
  defaultTab,
  rightSlot,
}: {
  title: string;
  description?: string;
  breadcrumb: string;
  tabs: HubTab[];
  defaultTab?: string;
  rightSlot?: ReactNode;
}) {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const visible = tabs.filter((t) => t.show !== false);
  const initial = search.get("tab") || defaultTab || visible[0]?.value;

  if (!visible.length) return null;

  const onChange = (val: string) => {
    const sp = new URLSearchParams(search);
    sp.set("tab", val);
    navigate(`?${sp.toString()}`, { replace: true });
  };

  const currentLabel = visible.find((t) => t.value === initial)?.label ?? visible[0].label;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <Breadcrumbs trail={[{ label: breadcrumb, to: undefined }, { label: currentLabel }]} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {rightSlot}
      </div>

      <Tabs value={initial} onValueChange={onChange} className="w-full">
        {/* Desktop tabs */}
        <TabsList className="hidden md:inline-flex flex-wrap h-auto">
          {visible.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
        {/* Mobile dropdown */}
        <div className="md:hidden">
          <Select value={initial} onValueChange={onChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {visible.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {visible.map((t) => {
          const C = getLazy(t);
          return (
            <TabsContent key={t.value} value={t.value} className="mt-4">
              <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
                <C />
              </Suspense>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
