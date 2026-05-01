import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

type Props = {
  avisoId: string;
  size?: "sm" | "default";
  className?: string;
};

export function AvisoReadButton({ avisoId, size = "sm", className }: Props) {
  const { user } = useAuth();
  const [readAt, setReadAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    db.from("aviso_reads")
      .select("read_at")
      .eq("aviso_id", avisoId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        setReadAt(data?.read_at ?? null);
        setLoading(false);
      });
  }, [avisoId, user]);

  const markRead = async () => {
    if (!user) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const { error } = await db.from("aviso_reads").insert({ aviso_id: avisoId, user_id: user.id });
    setSubmitting(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    setReadAt(now);
  };

  if (loading) return null;

  if (readAt) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 ${className ?? ""}`}>
        <Check className="h-3.5 w-3.5" />
        <span>Você leu em {new Date(readAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    );
  }

  return (
    <Button size={size} variant="outline" disabled={submitting} onClick={markRead} className={className}>
      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      Li e entendi
    </Button>
  );
}
