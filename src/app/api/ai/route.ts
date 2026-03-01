import { NextResponse } from "next/server";
import { z } from "zod";

import { generateMarkdown } from "@/lib/ai/generate-markdown";
import { insertAndSelectSingle } from "@/lib/supabase/query-helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type AIGenerationRow = Database["public"]["Tables"]["ai_generations"]["Row"];
type AIGenerationInsert = Database["public"]["Tables"]["ai_generations"]["Insert"];

const bodySchema = z.object({
  toolType: z.string().min(1),
  input: z.record(z.string(), z.unknown())
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const markdown = await generateMarkdown(parsed.data.toolType, parsed.data.input);

  const payload: AIGenerationInsert = {
    user_id: user.id,
    tool_type: parsed.data.toolType,
    prompt_input: parsed.data.input as Json,
    output_markdown: markdown
  };

  const { data: generation, error } = await insertAndSelectSingle<AIGenerationRow>(
    supabase,
    "ai_generations",
    payload
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to save AI generation", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    generation
  });
}
