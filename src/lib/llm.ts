import OpenAI from "openai";

let client: OpenAI | null = null;

export function getLlmClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.POLZA_API_KEY,
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
