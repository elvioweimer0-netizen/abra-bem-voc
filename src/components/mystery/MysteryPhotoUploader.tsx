import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

export function MysteryPhotoUploader({
  files,
  onChange,
  max = 5,
}: { files: File[]; onChange: (f: File[]) => void; max?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const next = [...files, ...picked].slice(0, max).filter((f) => f.size <= 5 * 1024 * 1024);
    onChange(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    onChange(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePick}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => inputRef.current?.click()}
        disabled={files.length >= max}
      >
        <Camera className="h-4 w-4" />
        Adicionar foto ({files.length}/{max})
      </Button>
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded overflow-hidden border bg-muted">
              <img src={src} className="w-full h-full object-cover" alt={`foto ${i + 1}`} />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 rounded-full bg-background/90 p-1 hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Remover foto"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">Máx. 5 MB por foto.</p>
    </div>
  );
}
