import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DateRange = { start: string; end: string };

function rangesToPg(ranges: DateRange[]): string[] {
  return ranges.map((r) => `[${r.start},${r.end}]`);
}
function pgToRanges(arr: any[] | null | undefined): DateRange[] {
  if (!arr) return [];
  return arr.map((s: string) => {
    const m = String(s).match(/^[\[\(]([\d-]+),([\d-]+)[\]\)]$/);
    if (!m) return null;
    const startInclusive = String(s).startsWith("[");
    const endInclusive = String(s).endsWith("]");
    let start = m[1];
    let end = m[2];
    if (!startInclusive) {
      const d = new Date(start); d.setDate(d.getDate() + 1); start = d.toISOString().slice(0, 10);
    }
    if (!endInclusive) {
      const d = new Date(end); d.setDate(d.getDate() - 1); end = d.toISOString().slice(0, 10);
    }
    return { start, end };
  }).filter(Boolean) as DateRange[];
}

export function useCoverageProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["coverage-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, available_for_coverage, coverage_dates")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return {
        profileId: data?.id as string,
        available: !!data?.available_for_coverage,
        ranges: pgToRanges(data?.coverage_dates),
      };
    },
  });

  const update = useMutation({
    mutationFn: async (input: { available: boolean; ranges: DateRange[] }) => {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          available_for_coverage: input.available,
          coverage_dates: input.ranges.length ? rangesToPg(input.ranges) : null,
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coverage-profile"] }),
  });

  return { ...query, update };
}
