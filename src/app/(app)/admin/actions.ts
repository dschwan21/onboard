"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  assertMutationSucceeded,
  getNextPosition,
  parseOptionalPositionValue,
  slugify
} from "@/lib/admin-utils";
import { requireAdmin } from "@/lib/auth/server";
import {
  insertAndSelectSingle,
  selectMaybeSingle,
  selectRows,
  updateWhereEq
} from "@/lib/supabase/query-helpers";
import type { Database } from "@/types/database";

type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];
type ModuleInsert = Database["public"]["Tables"]["modules"]["Insert"];
type LessonInsert = Database["public"]["Tables"]["lessons"]["Insert"];
type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type ModuleRow = Database["public"]["Tables"]["modules"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

function isChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function getNextModulePosition(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], courseId: string) {
  const { data: modules } = await selectRows<ModuleRow>(supabase, "modules", "position", {
    filters: [{ column: "course_id", value: courseId }]
  });

  return getNextPosition(modules);
}

async function getNextLessonPosition(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], moduleId: string) {
  const { data: lessons } = await selectRows<LessonRow>(supabase, "lessons", "position", {
    filters: [{ column: "module_id", value: moduleId }]
  });

  return getNextPosition(lessons);
}

export async function createCourseAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    redirect("/admin/courses");
  }

  const payload: CourseInsert = {
    title,
    slug: slugify(title),
    description: String(formData.get("description") ?? "").trim() || null,
    is_published: false
  };

  const course = assertMutationSucceeded(
    await insertAndSelectSingle<CourseRow>(supabase, "courses", payload),
    "Course creation did not return a row."
  );

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourseAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  const updateResult = await updateWhereEq(
    supabase,
    "courses",
    {
      title,
      slug: slugify(title),
      description: String(formData.get("description") ?? "").trim() || null,
      is_published: isChecked(formData, "isPublished")
    },
    {
      column: "id",
      value: courseId
    }
  );

  if (updateResult.error) {
    throw new Error(updateResult.error.message);
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createModuleAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const position = parseOptionalPositionValue(formData.get("position"));
  const payload: ModuleInsert = {
    course_id: courseId,
    title: String(formData.get("title") ?? "").trim() || "Untitled module",
    position: position ?? (await getNextModulePosition(supabase, courseId)),
    is_pro: isChecked(formData, "isPro")
  };

  const moduleResult = await insertAndSelectSingle<ModuleRow>(supabase, "modules", payload);

  assertMutationSucceeded(moduleResult, "Module creation did not return a row.");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateModuleAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "");

  const updateResult = await updateWhereEq(
    supabase,
    "modules",
    {
      title: String(formData.get("title") ?? "").trim() || "Untitled module",
      position: Number(formData.get("position") ?? 1),
      is_pro: isChecked(formData, "isPro")
    },
    {
      column: "id",
      value: moduleId
    }
  );

  if (updateResult.error) {
    throw new Error(updateResult.error.message);
  }

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createLessonAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const moduleId = String(formData.get("moduleId") ?? "");
  const position = parseOptionalPositionValue(formData.get("position"));
  const payload: LessonInsert = {
    module_id: moduleId,
    title: String(formData.get("title") ?? "").trim() || "Untitled lesson",
    position: position ?? (await getNextLessonPosition(supabase, moduleId)),
    is_published: false,
    content_markdown: "",
    task_prompt: null,
    video_url: null
  };

  const lesson = assertMutationSucceeded(
    await insertAndSelectSingle<LessonRow>(supabase, "lessons", payload),
    "Lesson creation did not return a row."
  );
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/lessons/${lesson.id}`);
}

export async function updateLessonAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const lessonId = String(formData.get("lessonId") ?? "");

  const updateResult = await updateWhereEq(
    supabase,
    "lessons",
    {
      title: String(formData.get("title") ?? "").trim() || "Untitled lesson",
      content_markdown: String(formData.get("contentMarkdown") ?? ""),
      task_prompt: String(formData.get("taskPrompt") ?? "").trim() || null,
      video_url: String(formData.get("videoUrl") ?? "").trim() || null,
      is_published: isChecked(formData, "isPublished"),
      position: Number(formData.get("position") ?? 1)
    },
    {
      column: "id",
      value: lessonId
    }
  );

  if (updateResult.error) {
    throw new Error(updateResult.error.message);
  }

  const { data: lesson } = await selectMaybeSingle<LessonRow>(supabase, "lessons", "*", {
    column: "id",
    value: lessonId
  });

  if (lesson) {
    const { data: module } = await selectMaybeSingle<ModuleRow>(supabase, "modules", "*", {
      column: "id",
      value: lesson.module_id
    });

    if (module) {
      revalidatePath(`/admin/courses/${module.course_id}`);
    }
  }

  revalidatePath(`/admin/lessons/${lessonId}`);
}
