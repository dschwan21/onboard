import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Playwright tests.");
}

export const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function createManagedUser(options: {
  emailPrefix: string;
  password: string;
  role?: "user" | "admin";
}) {
  const email = `${options.emailPrefix}-${randomUUID()}@gmail.com`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: options.password,
    email_confirm: true
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to create test user.");
  }

  await adminClient.from("profiles").upsert({
    id: data.user.id,
    role: options.role ?? "user",
    profession: "Tester",
    organization: "QA"
  });

  await adminClient.from("subscriptions").upsert({
    user_id: data.user.id,
    status: "inactive"
  });

  return {
    id: data.user.id,
    email,
    password: options.password
  };
}

export async function deleteManagedUser(userId: string) {
  await adminClient.auth.admin.deleteUser(userId);
}

export async function seedPublishedCourse() {
  const slug = `e2e-course-${randomUUID()}`;
  const title = `E2E Course ${slug.slice(-6)}`;
  const { data: course, error: courseError } = await adminClient
    .from("courses")
    .insert({
      title,
      slug,
      description: "Automated test course",
      is_published: true
    })
    .select("*")
    .single();

  if (courseError || !course) {
    throw new Error(courseError?.message ?? "Failed to create e2e course.");
  }

  const { data: module, error: moduleError } = await adminClient
    .from("modules")
    .insert({
      course_id: course.id,
      title: "Step 1",
      position: 1,
      is_pro: false
    })
    .select("*")
    .single();

  if (moduleError || !module) {
    throw new Error(moduleError?.message ?? "Failed to create e2e module.");
  }

  const { error: lessonError } = await adminClient.from("lessons").insert([
    {
      module_id: module.id,
      title: "Lesson 1",
      content_markdown: "# Lesson 1",
      task_prompt: "Write your response",
      video_url: null,
      is_published: true,
      position: 1
    },
    {
      module_id: module.id,
      title: "Lesson 2",
      content_markdown: "# Lesson 2",
      task_prompt: "Next step",
      video_url: null,
      is_published: true,
      position: 2
    }
  ]);

  if (lessonError) {
    throw new Error(lessonError.message);
  }

  return { courseId: course.id, title };
}
