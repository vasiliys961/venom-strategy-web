import { kv } from "@vercel/kv";
import { VenomCanvas, emptyCanvas } from "./types";

const inMemoryStore = new Map<string, VenomCanvas>();
const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

export async function loadCanvas(sessionId: string): Promise<VenomCanvas> {
  if (hasKv) {
    const data = await kv.get<VenomCanvas>(`venom:${sessionId}`);
    return data || emptyCanvas(sessionId);
  }
  return inMemoryStore.get(sessionId) || emptyCanvas(sessionId);
}

export async function saveCanvas(canvas: VenomCanvas): Promise<void> {
  if (hasKv) {
    await kv.set(`venom:${canvas.sessionId}`, canvas);
    return;
  }
  inMemoryStore.set(canvas.sessionId, canvas);
}
