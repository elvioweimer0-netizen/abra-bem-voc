import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

async function getSystemAnswer(question: string, unidade: string): Promise<string> {
  const q = question.toLowerCase();

  if (q.includes("colaborador") || q.includes("funcionário") || q.includes("equipe")) {
    const { count } = await supabase.from("colaboradores").select("id", { count: "exact", head: true });
    return `Atualmente existem ${count || 0} colaboradores cadastrados na sua unidade (${unidade}).`;
  }

  if (q.includes("advertência") || q.includes("advertencia")) {
    const { count } = await supabase.from("advertencias").select("id", { count: "exact", head: true });
    return `Existem ${count || 0} advertências registradas na sua unidade.`;
  }

  if (q.includes("suspensão") || q.includes("suspensao")) {
    const { count } = await supabase.from("suspensoes").select("id", { count: "exact", head: true });
    return `Existem ${count || 0} suspensões registradas na sua unidade.`;
  }

  if (q.includes("ocorrência") || q.includes("ocorrencia")) {
    const { count } = await supabase.from("ocorrencias").select("id", { count: "exact", head: true });
    return `Existem ${count || 0} ocorrências registradas na sua unidade.`;
  }

  if (q.includes("setor") || q.includes("departamento")) {
    return "Os setores disponíveis são: Açougue, Padaria, Hortifruti, Mercearia, Frente de Caixa e Depósito. Acesse a página de Departamentos para ver detalhes.";
  }

  return "Desculpe, não entendi sua pergunta. Tente perguntar sobre colaboradores, advertências, suspensões, ocorrências ou setores.";
}

export default function Assistente() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Sou o assistente da Central do Líder. Posso ajudar com informações sobre colaboradores, advertências, suspensões, ocorrências e setores. Como posso ajudar?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !profile) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    const answer = await getSystemAnswer(userMessage, profile.unidade);
    setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-6 h-6 text-primary" /> Assistente IA</h1>
        <p className="text-muted-foreground">Faça perguntas sobre dados do sistema</p>
      </div>

      <Card className="card-shadow">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] p-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted p-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex gap-2">
            <Input
              placeholder="Digite sua pergunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
