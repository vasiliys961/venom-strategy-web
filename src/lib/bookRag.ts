import { kv } from "@vercel/kv";

const inMemoryChunks = new Map<string, string[]>();
const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const CHUNK_SIZE = 1200;
const MAX_CHUNKS_STORED = 400;

function chunkText(text: string, size = CHUNK_SIZE): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length && chunks.length < MAX_CHUNKS_STORED; i += size) {
    chunks.push(cleaned.slice(i, i + size));
  }
  return chunks;
}

export async function storeBook(sessionId: string, rawText: string): Promise<number> {
  const chunks = chunkText(rawText);
  if (hasKv) {
    await kv.set(`book:${sessionId}`, chunks);
  } else {
    inMemoryChunks.set(sessionId, chunks);
  }
  return chunks.length;
}

export async function hasBook(sessionId: string): Promise<boolean> {
  if (hasKv) {
    const chunks = await kv.get<string[]>(`book:${sessionId}`);
    return Boolean(chunks && chunks.length > 0);
  }
  return (inMemoryChunks.get(sessionId)?.length || 0) > 0;
}

function scoreChunk(chunk: string, queryWords: string[]): number {
  const lower = chunk.toLowerCase();
  return queryWords.reduce((score, word) => (lower.includes(word) ? score + 1 : score), 0);
}

export async function retrieveFromBook(sessionId: string, query: string, k = 3): Promise<string> {
  const chunks = hasKv ? await kv.get<string[]>(`book:${sessionId}`) : inMemoryChunks.get(sessionId);
  if (!chunks || chunks.length === 0) return "";

  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (queryWords.length === 0) return "";

  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryWords) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  if (scored.length === 0) return "";

  const joined = scored.map((c) => c.chunk).join("\n---\n");
  return `Контекст из книги пользователя (используй для точности, но не цитируй целиком без необходимости):\n\n${joined}`;
}

export async function clearBook(sessionId: string): Promise<void> {
  if (hasKv) {
    await kv.del(`book:${sessionId}`);
  } else {
    inMemoryChunks.delete(sessionId);
  }
}
