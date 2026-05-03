import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Smile, X, Mic, Square } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { uploadChatMedia } from "@/hooks/useChatMediaUpload";
import { toast } from "sonner";
import type { ChatMessage } from "@/hooks/useConversation";

const EMOJIS = ["😀","😂","🥰","😍","🤔","😎","😢","🥳","🙏","👍","❤️","🔥","💯","💪","🎉","✅"];

interface Props {
  conversationId: string;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (params: { content?: string; replyTo?: string | null; media?: { url: string; type: any } | null }) => Promise<void>;
  onTyping: () => void;
}

export function MessageInput({ conversationId, replyTo, onCancelReply, onSend, onTyping }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    try {
      await onSend({ content, replyTo: replyTo?.id ?? null });
      setText(""); onCancelReply();
    } catch (e: any) { toast.error(e.message ?? "Erro ao enviar"); }
    finally { setBusy(false); }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    try {
      const media = await uploadChatMedia(conversationId, f);
      await onSend({ media, replyTo: replyTo?.id ?? null });
      onCancelReply();
    } catch (err: any) { toast.error(err.message ?? "Falha no upload"); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const startRecord = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: "audio/webm" });
        setBusy(true);
        try {
          const media = await uploadChatMedia(conversationId, file);
          await onSend({ media });
        } catch (err: any) { toast.error(err.message ?? "Falha no áudio"); }
        finally { setBusy(false); }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch { toast.error("Microfone indisponível"); }
  }, [conversationId, onSend]);

  const stopRecord = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const onChange = (v: string) => {
    setText(v);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    onTyping();
    typingTimer.current = setTimeout(() => {}, 500);
  };

  return (
    <div className="border-t border-border bg-card p-3">
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-muted/40 px-3 py-1.5 text-xs">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-primary">{replyTo.author_name}</p>
            <p className="truncate text-muted-foreground">{replyTo.content ?? "[mídia]"}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept="image/*,video/*,application/pdf,.doc,.docx,.xlsx" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0"><Smile className="h-5 w-5" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setText((t) => t + e)} className="text-xl hover:scale-125 transition">{e}</button>
            ))}
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          value={text} onChange={(e) => onChange(e.target.value)}
          placeholder="Mensagem..." rows={1}
          className="min-h-10 max-h-32 resize-none py-2"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        {text.trim() ? (
          <Button onClick={send} disabled={busy} size="icon" className="h-10 w-10 shrink-0"><Send className="h-5 w-5" /></Button>
        ) : recording ? (
          <Button onClick={stopRecord} size="icon" variant="destructive" className="h-10 w-10 shrink-0"><Square className="h-5 w-5" /></Button>
        ) : (
          <Button onClick={startRecord} disabled={busy} size="icon" className="h-10 w-10 shrink-0"><Mic className="h-5 w-5" /></Button>
        )}
      </div>
    </div>
  );
}
