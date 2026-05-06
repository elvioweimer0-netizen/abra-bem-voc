import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload, X, FileAudio, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type AudioItem = {
  id: string;
  file: File;
  durationSec?: number;
  status: "pending" | "transcribing" | "done" | "error";
  progress?: number;
  transcript?: string;
  error?: string;
};

const ACCEPT = "audio/*,.opus,.mp3,.m4a,.ogg,.wav,.webm,.aac";
const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_SEC = 30 * 60;
const MAX_REC_SEC = 5 * 60;

function fmtSize(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
}
function fmtDur(s?: number) {
  if (!s || !isFinite(s)) return "";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

async function probeDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => {
        const d = a.duration;
        URL.revokeObjectURL(url);
        resolve(isFinite(d) ? d : undefined);
      };
      a.onerror = () => { URL.revokeObjectURL(url); resolve(undefined); };
      a.src = url;
    } catch { resolve(undefined); }
  });
}

export function WhatsappAudioInput({
  items,
  onChange,
  disabled,
}: {
  items: AudioItem[];
  onChange: (items: AudioItem[]) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const totalBytes = items.reduce((a, b) => a + b.file.size, 0);
  const totalSec = items.reduce((a, b) => a + (b.durationSec ?? 0), 0);

  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    let next = [...items];
    for (const f of files) {
      if (next.length >= MAX_FILES) { toast.error(`Máximo ${MAX_FILES} arquivos`); break; }
      if (!/^audio\//.test(f.type) && !/\.(opus|mp3|m4a|ogg|wav|webm|aac)$/i.test(f.name)) {
        toast.error(`Formato não suportado: ${f.name}`);
        continue;
      }
      const dur = await probeDuration(f);
      const newTotalBytes = next.reduce((a, b) => a + b.file.size, 0) + f.size;
      const newTotalSec = next.reduce((a, b) => a + (b.durationSec ?? 0), 0) + (dur ?? 0);
      if (newTotalBytes > MAX_TOTAL_BYTES) { toast.error("Limite de 50MB total"); break; }
      if (newTotalSec > MAX_TOTAL_SEC) { toast.error("Limite de 30min de áudio"); break; }
      next.push({ id: crypto.randomUUID(), file: f, durationSec: dur, status: "pending" });
    }
    onChange(next);
  }, [items, onChange]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addFiles(files);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPaste = useCallback((e: ClipboardEvent) => {
    if (disabled) return;
    const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("audio/") || /\.(opus|mp3|m4a|ogg|wav|webm)$/i.test(f.name));
    if (files.length) { e.preventDefault(); addFiles(files); }
  }, [addFiles, disabled]);

  useEffect(() => {
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [onPaste]);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `gravacao-${Date.now()}.webm`, { type: "audio/webm" });
        await addFiles([file]);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setRecSec(0);
      timerRef.current = window.setInterval(() => {
        setRecSec((s) => {
          if (s + 1 >= MAX_REC_SEC) { stopRec(); return s + 1; }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error("Microfone indisponível");
    }
  };
  const stopRec = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecording(false);
  };

  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <Button type="button" onClick={startRec} disabled={disabled} variant="default">
            <Mic className="mr-2 h-4 w-4" /> Gravar áudio
          </Button>
        ) : (
          <Button type="button" onClick={stopRec} variant="destructive">
            <Square className="mr-2 h-4 w-4" /> Parar ({fmtDur(recSec)})
          </Button>
        )}
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={disabled}>
          <Upload className="mr-2 h-4 w-4" /> Selecionar arquivos
        </Button>
        <input ref={fileRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={handleFileInput} />
      </div>

      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-lg border-2 border-dashed p-4 text-center text-sm text-muted-foreground transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted"}`}
      >
        Arraste áudios aqui, cole (Ctrl+V) ou use os botões acima.
        <div className="mt-1 text-xs">
          {items.length}/{MAX_FILES} arquivos · {fmtSize(totalBytes)} / 50MB · {fmtDur(totalSec)} / 30:00
        </div>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 rounded-md border bg-card p-2 text-sm">
              <FileAudio className="h-4 w-4 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{it.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtSize(it.file.size)} · {fmtDur(it.durationSec)}
                  {it.status === "transcribing" && ` · transcrevendo ${it.progress ?? 0}%`}
                  {it.status === "done" && ` · ✓ transcrito`}
                  {it.status === "error" && ` · ✗ ${it.error ?? "falhou"}`}
                </p>
              </div>
              {it.status === "transcribing" && <Loader2 className="h-4 w-4 animate-spin" />}
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(it.id)} disabled={disabled || it.status === "transcribing"}>
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
