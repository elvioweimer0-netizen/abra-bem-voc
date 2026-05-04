import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CreateMysteryVisitInput = {
  target_unit_id: string;
  visit_date: string;
  visit_time?: string | null;
  anonymous_to_team: boolean;
  notes?: string | null;
  scores: { criteria_id: string; score: number; comment?: string | null }[];
  photos?: File[];
};

export function useCreateMysteryVisit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMysteryVisitInput) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!prof?.id) throw new Error("Perfil não encontrado");

      // 1. Create visit
      const { data: visit, error: visitErr } = await (supabase as any)
        .from("mystery_visits")
        .insert({
          visitor_user_id: prof.id,
          target_unit_id: input.target_unit_id,
          visit_date: input.visit_date,
          visit_time: input.visit_time || null,
          anonymous_to_team: input.anonymous_to_team,
          notes: input.notes?.trim() || null,
          photos: [],
        })
        .select()
        .single();
      if (visitErr) throw visitErr;

      // 2. Insert scores
      if (input.scores.length > 0) {
        const rows = input.scores.map((s) => ({
          visit_id: visit.id,
          criteria_id: s.criteria_id,
          score: s.score,
          comment: s.comment?.trim() || null,
        }));
        const { error: scErr } = await (supabase as any)
          .from("mystery_visit_scores")
          .insert(rows);
        if (scErr) throw scErr;
      }

      // 3. Upload photos
      const uploadedPaths: string[] = [];
      if (input.photos && input.photos.length > 0) {
        for (let i = 0; i < input.photos.length; i++) {
          const file = input.photos[i];
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${visit.id}/${Date.now()}_${i}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("mystery-photos")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (upErr) {
            console.error("photo upload error", upErr);
            continue;
          }
          uploadedPaths.push(path);
        }
        if (uploadedPaths.length > 0) {
          await (supabase as any)
            .from("mystery_visits")
            .update({ photos: uploadedPaths })
            .eq("id", visit.id);
        }
      }

      return visit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mystery_visits"] });
      qc.invalidateQueries({ queryKey: ["mystery_comparative"] });
    },
  });
}
