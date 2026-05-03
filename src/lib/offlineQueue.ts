import { get, set, del, createStore } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";

export type PendingActionType = "aviso_read" | "checklist_response" | "praise_create";

export interface PendingAction {
  id: string;
  type: PendingActionType;
  payload: Record<string, any>;
  created_at: number;
  retries: number;
  last_error?: string;
}

const store = createStore("curio-offline", "queue");
const QUEUE_KEY = "pending_actions";
const BLOB_PREFIX = "blob:";

function uuid() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export async function getQueue(): Promise<PendingAction[]> {
  return (await get<PendingAction[]>(QUEUE_KEY, store)) || [];
}

async function saveQueue(q: PendingAction[]) {
  await set(QUEUE_KEY, q, store);
}

export async function enqueue(type: PendingActionType, payload: Record<string, any>): Promise<PendingAction> {
  const action: PendingAction = {
    id: uuid(),
    type,
    payload,
    created_at: Date.now(),
    retries: 0,
  };
  const q = await getQueue();
  q.push(action);
  await saveQueue(q);
  notifyChange();
  return action;
}

export async function removeAction(id: string) {
  const q = (await getQueue()).filter((a) => a.id !== id);
  await saveQueue(q);
  notifyChange();
}

export async function clearQueue() {
  await del(QUEUE_KEY, store);
  notifyChange();
}

export async function saveBlob(blob: Blob): Promise<string> {
  const id = `${BLOB_PREFIX}${uuid()}`;
  await set(id, blob, store);
  return id;
}

export async function loadBlob(id: string): Promise<Blob | undefined> {
  return await get<Blob>(id, store);
}

export async function dropBlob(id: string) {
  await del(id, store);
}

const listeners = new Set<() => void>();
export function subscribeQueue(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notifyChange() {
  listeners.forEach((l) => {
    try { l(); } catch {}
  });
}

async function executeAction(a: PendingAction): Promise<{ ok: boolean; conflict?: boolean; error?: string }> {
  const db = supabase as any;
  try {
    if (a.type === "aviso_read") {
      const { error } = await db.from("aviso_reads").insert({
        aviso_id: a.payload.aviso_id,
        user_id: a.payload.user_id,
      });
      if (error) {
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("duplicate") || error.code === "23505") return { ok: true, conflict: true };
        return { ok: false, error: error.message };
      }
      return { ok: true };
    }
    if (a.type === "praise_create") {
      const { error } = await db.from("praises").insert({ id: a.payload.id, ...a.payload.fields });
      if (error) {
        if (error.code === "23505") return { ok: true, conflict: true };
        return { ok: false, error: error.message };
      }
      return { ok: true };
    }
    if (a.type === "checklist_response") {
      // Upload de foto se houver blob_id
      let photo_url: string | undefined;
      if (a.payload.blob_id) {
        const blob = await loadBlob(a.payload.blob_id);
        if (blob) {
          const path = `${a.payload.user_id}/checklist-${a.payload.id || uuid()}.jpg`;
          const { error: upErr } = await supabase.storage.from("checklist-photos").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
          if (upErr) return { ok: false, error: upErr.message };
          photo_url = path;
          await dropBlob(a.payload.blob_id);
        }
      }
      const row = { ...a.payload.fields, ...(photo_url ? { photo_url } : {}) };
      const { error } = await db.from(a.payload.table || "checklist_responses").insert(row);
      if (error) {
        if (error.code === "23505") return { ok: true, conflict: true };
        return { ok: false, error: error.message };
      }
      return { ok: true };
    }
    return { ok: false, error: "unknown action type" };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

let processing = false;

export async function processQueue(onProgress?: (s: { remaining: number }) => void): Promise<{ done: number; failed: number }> {
  if (processing) return { done: 0, failed: 0 };
  processing = true;
  let done = 0;
  let failed = 0;
  try {
    let q = await getQueue();
    for (const action of [...q]) {
      const result = await executeAction(action);
      if (result.ok) {
        await removeAction(action.id);
        done++;
      } else {
        action.retries += 1;
        action.last_error = result.error;
        if (action.retries >= 5) {
          await removeAction(action.id);
          failed++;
        } else {
          // Backoff: aguarda mas mantém na fila pra próxima rodada
          q = await getQueue();
          const idx = q.findIndex((x) => x.id === action.id);
          if (idx >= 0) { q[idx] = action; await saveQueue(q); }
          await new Promise((r) => setTimeout(r, Math.min(30000, 1000 * 2 ** action.retries)));
          failed++;
        }
      }
      onProgress?.({ remaining: (await getQueue()).length });
    }
  } finally {
    processing = false;
    notifyChange();
  }
  return { done, failed };
}
