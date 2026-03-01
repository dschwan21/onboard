import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .upsert(
      {
        slug: "ai-foundations-for-professionals",
        title: "AI Foundations for Professionals",
        description: "Core concepts for using AI confidently at work.",
        is_published: true
      },
      {
        onConflict: "slug"
      }
    )
    .select("id")
    .single();

  if (courseError) {
    throw courseError;
  }

  const { data: module, error: moduleError } = await supabase
    .from("modules")
    .upsert(
      {
        course_id: course.id,
        title: "Module 1: Practical AI Basics",
        position: 1
      },
      {
        onConflict: "course_id,position"
      }
    )
    .select("id")
    .single();

  if (moduleError) {
    throw moduleError;
  }

  const { error: lessonError } = await supabase.from("lessons").upsert(
    {
      module_id: module.id,
      title: "Lesson 1: What AI can do for your workflow",
      content_markdown:
        "# Welcome to Onboard\n\nThis is example seeded lesson content.",
      position: 1
    },
    {
      onConflict: "module_id,position"
    }
  );

  if (lessonError) {
    throw lessonError;
  }

  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
