"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/server";
import { completeLesson } from "@/lib/courses";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function lessonPath(courseId: string, lessonId: string) {
  return `/course/${courseId}/${lessonId}`;
}

export async function submitLessonAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const courseId = getString(formData, "courseId");
  const lessonId = getString(formData, "lessonId");
  const submissionText = getString(formData, "submissionText");
  const nextLessonHref = getString(formData, "nextLessonHref");

  await completeLesson(supabase, user.id, lessonId, submissionText);

  revalidatePath("/course");
  revalidatePath(`/course/${courseId}`);
  revalidatePath(lessonPath(courseId, lessonId));

  if (nextLessonHref) {
    redirect(`${lessonPath(courseId, lessonId)}?completed=1&next=${encodeURIComponent(nextLessonHref)}`);
  }

  redirect(`${lessonPath(courseId, lessonId)}?completed=1`);
}

export async function markLessonCompleteAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const courseId = getString(formData, "courseId");
  const lessonId = getString(formData, "lessonId");
  const nextLessonHref = getString(formData, "nextLessonHref");

  await completeLesson(supabase, user.id, lessonId);

  revalidatePath("/course");
  revalidatePath(`/course/${courseId}`);
  revalidatePath(lessonPath(courseId, lessonId));

  if (nextLessonHref) {
    redirect(`${lessonPath(courseId, lessonId)}?completed=1&next=${encodeURIComponent(nextLessonHref)}`);
  }

  redirect(`${lessonPath(courseId, lessonId)}?completed=1`);
}
