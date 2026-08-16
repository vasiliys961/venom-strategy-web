import OpenAI from "openai";

let client: OpenAI | null = null;

export function getLlmClient(): OpenAI {
  const apiKey = process.env.POLZA_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "POLZA_API_KEY не задан. добавьте его в Settings → Environment Variables на Vercel и сделайте Redeploy."
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: process.env.POLZA_BASE_URL || "https://polza.ai/api/v1",
    });
  }
  return client;
}

export async function askJson(systemPrompt: string, userInput: string): Promise<Record<string, unknown>> {
  const llm = getLlmClient();
  const model = process.env.LLM_MODEL || "anthropic/claude-sonnet-5";

  const completion = await llm.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput || "(пользователь пока ничего не написал, начни диалог)" },
    ],
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  try {
    const cleaned = raw.trim().replace(/^```json\n?/, "").replace(/```$/, "");
    return JSON.parse(cleaned);
  } catch {
    return { reply: raw, done: false };
  }
}

export async function askText(systemPrompt: string): Promise<string> {
  const llm = getLlmClient();
  const model = process.env.LLM_MODEL || "anthropic/claude-sonnet-5";

  const completion = await llm.chat.completions.create({
    model,
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.5,
  });

  return completion.choices[0]?.message?.content || "";
}
