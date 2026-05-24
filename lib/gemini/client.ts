import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return groqClient;
}

export async function generateJson<T>(prompt: string): Promise<T> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });
  const text = completion.choices[0].message.content ?? "{}";
  return JSON.parse(text) as T;
}

export async function generateText(prompt: string): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  return completion.choices[0].message.content ?? "";
}
