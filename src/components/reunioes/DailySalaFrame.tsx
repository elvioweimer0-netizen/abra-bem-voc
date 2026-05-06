import { useEffect, useRef } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  roomUrl: string;
  meetingId: string;
  onLeave: () => void;
}

export function DailySalaFrame({ roomUrl, meetingId, onLeave }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const recordingChunks = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const call = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: { width: "100%", height: "100%", border: "0", borderRadius: "12px" },
      showLeaveButton: true,
      showFullscreenButton: true,
    });
    callRef.current = call;

    call.on("left-meeting", async () => {
      try {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          recorderRef.current.stop();
        }
      } catch {}
      onLeave();
    });

    call.on("joined-meeting", async () => {
      // Try local recording fallback (Daily cloud recording requires paid plan).
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
        recorderRef.current = mr;
        mr.ondataavailable = (e) => { if (e.data.size > 0) recordingChunks.current.push(e.data); };
        mr.onstop = async () => {
          if (recordingChunks.current.length === 0) return;
          const blob = new Blob(recordingChunks.current, { type: "audio/webm" });
          const file = new File([blob], "meeting-recording.webm", { type: "audio/webm" });
          const form = new FormData();
          form.append("meetingId", meetingId);
          form.append("file", file);
          toast.message("Processando ata da reunião…");
          try {
            await supabase.functions.invoke("process-meeting-recording", { body: form });
            toast.success("Ata em processamento. Confira no Histórico em instantes.");
          } catch (err: any) {
            toast.error("Falha ao enviar gravação: " + (err?.message || "erro"));
          }
        };
        mr.start(5000);
      } catch (err) {
        console.warn("[DailySalaFrame] sem permissão de microfone para gravação local", err);
      }
    });

    call.join({ url: roomUrl }).catch((err) => {
      toast.error("Erro ao entrar na sala: " + (err?.message || "erro"));
      onLeave();
    });

    return () => {
      try { localStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      try { call.leave(); } catch {}
      try { call.destroy(); } catch {}
      callRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomUrl, meetingId]);

  return <div ref={containerRef} className="w-full h-[70vh] min-h-[500px] rounded-xl overflow-hidden bg-muted" />;
}
