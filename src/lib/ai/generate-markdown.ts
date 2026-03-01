import OpenAI from "openai";

import { getServerEnv } from "@/lib/config/env";

const SYSTEM_PROMPT = `You are the Onboard AI assistant. Return only markdown.
Use clear headings, concise explanations, and actionable output for non-technical professionals.
Avoid JSON, XML, or code fences unless the user explicitly requests them.`;

let openaiClient: OpenAI | null = null;

function getOpenAI() {
  if (!openaiClient) {
    const env = getServerEnv();
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  return openaiClient;
}

export async function generateMarkdown(toolType: string, input: Record<string, unknown>) {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: `Tool type: ${toolType}\nStructured input:\n${JSON.stringify(input, null, 2)}`
      }
    ]
  });

  return completion.choices[0]?.message.content?.trim() ?? "# No output returned";
}
