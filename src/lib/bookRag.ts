import { Index } from "@upstash/vector";
import OpenAI from "openai";

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "thenlper/gte-base";
const EMBEDDING_DIMENSION = 768;

let vectorIndex: Index | null = null;
let embeddingClient: OpenAI | null = null;

const inMemoryVectors = new Map<string, { id: string; embedding: number[]; text: string }[]>();
const hasVector = Boolean(process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN);

function getVectorIndex(): Index {
  if (!vectorIndex) {
    vectorIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });
  }
  return vectorIndex;
}

function getEmbeddingClient(): OpenAI {
  if (!embeddingClient) {
    embeddingClient = new OpenAI({
      apiKey: process.env.POLZA_API_KEY,
      baseURL: process.env.POLZA_BASE_URL || "https://polza.ai/api/v1",
    });
  }
  return embeddingClient;
}

async function embed(texts: string[]): Promise<number[][]> {
  const client = getEmbeddingClient();
  const resp = await client.embeddings.create({ model: EMBEDDING_MODEL, input: texts });
  return resp.data.map((d) => d.embedding);
}

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
  if (chunks.length === 0) return 0;

  const batchSize = 50;
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await embed(batch);
    allEmbeddings.push(...embeddings);
  }

  if (hasVector) {
    const index = getVectorIndex();
    const vectors = chunks.map((chunk, i) => ({
      id: `${sessionId}-${i}`,
      vector: allEmbeddings[i],
      data: chunk,
      metadata: { sessionId },
    }));
    for (let i = 0; i < vectors.length; i += batchSize) {
      await index.upsert(vectors.slice(i, i + batchSize));
    }
  } else {
    const records = chunks.map((chunk, i) => ({
      id: `${sessionId}-${i}`,
      embedding: allEmbeddings[i],
      text: chunk,
    }));
    inMemoryVectors.set(sessionId, records);
  }

  return chunks.length;
}

export async function hasBook(sessionId: string): Promise<boolean> {
  if (hasVector) {
    try {
      const index = getVectorIndex();
      const result = await index.query({
        vector: new Array(EMBEDDING_DIMENSION).fill(0),
        topK: 1,
        filter: `sessionId = "${sessionId}"`,
        includeMetadata: false,
      });
      return result.length > 0;
    } catch {
      return false;
    }
  }
  return (inMemoryVectors.get(sessionId)?.length || 0) > 0;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

export async function retrieveFromBook(sessionId: string, query: string, k = 3): Promise<string> {
  if (!query) return "";

  if (hasVector) {
    try {
      const index = getVectorIndex();
      const [queryEmbedding] = await embed([query]);
      const result = await index.query({
        vector: queryEmbedding,
        topK: k,
        filter: `sessionId = "${sessionId}"`,
        includeMetadata: false,
        includeData: true,
      });
      if (result.length === 0) return "";
      const joined = result.map((r) => r.data).join("\n---\n");
      return `Контекст из книги пользователя (используй для точности, но не цитируй целиком без необходимости):\n\n${joined}`;
    } catch (err) {
      console.error("Upstash Vector query failed:", err);
      return "";
    }
  }

  const records = inMemoryVectors.get(sessionId);
  if (!records || records.length === 0) return "";

  const [queryEmbedding] = await embed([query]);
  const scored = records
    .map((r) => ({ text: r.text, score: cosineSimilarity(queryEmbedding, r.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  const joined = scored.map((s) => s.text).join("\n---\n");
  return `Контекст из книги пользователя (используй для точности, но не цитируй целиком без необходимости):\n\n${joined}`;
}

export async function clearBook(sessionId: string): Promise<void> {
  if (hasVector) {
    try {
      const index = getVectorIndex();
      await index.delete({ filter: `sessionId = "${sessionId}"` });
    } catch (err) {
      console.error("Upstash Vector delete failed:", err);
    }
  } else {
    inMemoryVectors.delete(sessionId);
  }
}
