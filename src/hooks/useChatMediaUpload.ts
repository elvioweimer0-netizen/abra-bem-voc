import { supabase } from "@/integrations/supabase/client";

export async function uploadChatMedia(conversationId: string, file: File): Promise<{ url: string; type: "image" | "video" | "audio" | "document" }> {
  if (file.size > 50 * 1024 * 1024) throw new Error("Arquivo maior que 50MB");
  const ext = file.name.split(".").pop() || "bin";
  const path = `${conversationId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("chat-media").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data: signed } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 60 * 24 * 7);
  const url = signed?.signedUrl ?? path;
  let type: "image" | "video" | "audio" | "document" = "document";
  if (file.type.startsWith("image/")) type = "image";
  else if (file.type.startsWith("video/")) type = "video";
  else if (file.type.startsWith("audio/")) type = "audio";
  return { url, type };
}
