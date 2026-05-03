import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMentors, type MentorRow } from "@/hooks/useMentors";
import { useMentorshipTopics } from "@/hooks/useMentorshipTopics";
import { MentorCard } from "@/components/mentorship/MentorCard";
import { NovaMentoriaModal } from "@/components/mentorship/NovaMentoriaModal";
import { MentorshipOffersEditor } from "@/components/mentorship/MentorshipOffersEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Settings, Users, Inbox } from "lucide-react";

export default function MentoriaPage() {
  const [topicId, setTopicId] = useState<string>("all");
  const [unitId, setUnitId] = useState<string>("all");
  const [selectedMentor, setSelectedMentor] = useState<MentorRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const { data: topics } = useMentorshipTopics();
  const { data: units } = useQuery({
    queryKey: ["units-active"],
    queryFn: async () => {
      const { data } = await supabase.from("units").select("id, name").eq("active", true).order("name");
      return data ?? [];
    },
  });
  const { data: mentors, isLoading } = useMentors({
    topicId: topicId === "all" ? undefined : topicId,
    unitId: unitId === "all" ? undefined : unitId,
  });

  return (
    <div className="container mx-auto p-4 space-y-4 pb-20">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Mentoria informal
          </h1>
          <p className="text-sm text-muted-foreground">
            Tô aberto a conversar — encontre alguém pra trocar uma ideia
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/minhas-mentorias"><Inbox className="mr-2 h-4 w-4" /> Minhas mentorias</Link>
          </Button>
          <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Settings className="mr-2 h-4 w-4" /> Meus tópicos</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <MentorshipOffersEditor />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Tópico</Label>
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {topics?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Unidade</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {units?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !mentors?.length ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
          Nenhum mentor disponível com esses filtros. Que tal você se oferecer? Clique em "Meus tópicos".
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <MentorCard
              key={m.user_id}
              mentor={m}
              onRequest={(mentor) => { setSelectedMentor(mentor); setModalOpen(true); }}
            />
          ))}
        </div>
      )}

      <NovaMentoriaModal mentor={selectedMentor} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
