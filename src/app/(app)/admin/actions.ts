"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertMutationSucceeded, getNextPosition, slugify } from "@/lib/admin-utils";
import { requireAdmin } from "@/lib/auth/server";
import {
  deleteWhereEq,
  insertAndSelectSingle,
  selectMaybeSingle,
  selectRows,
  updateWhereEq
} from "@/lib/supabase/query-helpers";
import type { Database } from "@/types/database";

type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];
type LessonInsert = Database["public"]["Tables"]["lessons"]["Insert"];
type LessonSectionInsert = Database["public"]["Tables"]["lesson_sections"]["Insert"];
type LessonBlockInsert = Database["public"]["Tables"]["lesson_blocks"]["Insert"];
type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonSectionRow = Database["public"]["Tables"]["lesson_sections"]["Row"];
type LessonBlockRow = Database["public"]["Tables"]["lesson_blocks"]["Row"];
type LessonUpdate = Database["public"]["Tables"]["lessons"]["Update"];
type LessonSectionUpdate = Database["public"]["Tables"]["lesson_sections"]["Update"];
type LessonBlockUpdate = Database["public"]["Tables"]["lesson_blocks"]["Update"];

function isChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function parseOrderedIds(formData: FormData) {
  return getString(formData, "orderedIds")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function assertNoMutationError(result: { error: { message: string } | null }) {
  if (result.error) {
    throw new Error(result.error.message);
  }
}

async function reorderByIds<Row extends { id: string; position: number }>(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  table: "lessons" | "lesson_sections" | "lesson_blocks",
  rows: Row[],
  orderedIds: string[]
) {
  const orderedRows = orderedIds
    .map((id) => rows.find((row) => row.id === id) ?? null)
    .filter((row): row is Row => row !== null);

  if (orderedRows.length !== rows.length) {
    throw new Error("Ordered items did not match the saved records.");
  }

  const offset = rows.length + 100;

  for (const [index, row] of orderedRows.entries()) {
    await assertNoMutationError(
      await updateWhereEq(supabase, table, { position: offset + index + 1 }, { column: "id", value: row.id })
    );
  }

  for (const [index, row] of orderedRows.entries()) {
    await assertNoMutationError(
      await updateWhereEq(supabase, table, { position: index + 1 }, { column: "id", value: row.id })
    );
  }
}

async function getNextLessonPosition(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  courseId: string
) {
  const { data: lessons } = await selectRows<LessonRow>(supabase, "lessons", "position", {
    filters: [{ column: "course_id", value: courseId }]
  });

  return getNextPosition(lessons);
}

async function getNextSectionPosition(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  lessonId: string
) {
  const { data: sections } = await selectRows<LessonSectionRow>(supabase, "lesson_sections", "position", {
    filters: [{ column: "lesson_id", value: lessonId }]
  });

  return getNextPosition(sections);
}

async function getNextBlockPosition(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  sectionId: string
) {
  const { data: blocks } = await selectRows<LessonBlockRow>(supabase, "lesson_blocks", "position", {
    filters: [{ column: "lesson_section_id", value: sectionId }]
  });

  return getNextPosition(blocks);
}

async function getSectionBlocks(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  sectionId: string
) {
  const { data: blocks } = await selectRows<LessonBlockRow>(supabase, "lesson_blocks", "*", {
    filters: [{ column: "lesson_section_id", value: sectionId }],
    orderBy: { column: "position", ascending: true }
  });

  return blocks;
}

async function shiftBlockPositions(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  sectionId: string,
  insertPosition: number
) {
  const blocks = await getSectionBlocks(supabase, sectionId);
  const affected = blocks.filter((block) => block.position >= insertPosition).reverse();

  for (const block of affected) {
    await assertNoMutationError(
      await updateWhereEq(supabase, "lesson_blocks", { position: block.position + 1 }, {
        column: "id",
        value: block.id
      })
    );
  }
}

async function normalizeBlockPositions(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  sectionId: string
) {
  const blocks = await getSectionBlocks(supabase, sectionId);

  for (const [index, block] of blocks.entries()) {
    const nextPosition = index + 1;

    if (block.position !== nextPosition) {
      await assertNoMutationError(
        await updateWhereEq(supabase, "lesson_blocks", { position: nextPosition }, {
          column: "id",
          value: block.id
        })
      );
    }
  }
}

export async function createCourseAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const title = getString(formData, "title").trim();

  if (!title) {
    redirect("/admin/courses");
  }

  const payload: CourseInsert = {
    title,
    slug: slugify(title),
    description: getString(formData, "description").trim() || null,
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
  const courseId = getString(formData, "courseId");
  const title = getString(formData, "title").trim();

  await assertNoMutationError(
    await updateWhereEq(
      supabase,
      "courses",
      {
        title,
        slug: slugify(title),
        description: getString(formData, "description").trim() || null,
        is_published: isChecked(formData, "isPublished")
      },
      {
        column: "id",
        value: courseId
      }
    )
  );

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/course");
  revalidatePath(`/course/${courseId}`);
}

export async function createLessonAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = getString(formData, "courseId");
  const payload: LessonInsert = {
    course_id: courseId,
    title: getString(formData, "title").trim() || "Untitled lesson",
    position: await getNextLessonPosition(supabase, courseId),
    is_published: false,
    content_markdown: "",
    task_prompt: null,
    video_url: null,
    module_id: null
  };

  const lesson = assertMutationSucceeded(
    await insertAndSelectSingle<LessonRow>(supabase, "lessons", payload),
    "Lesson creation did not return a row."
  );

  await createLessonSectionForNewLesson(supabase, lesson.id);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/course/${courseId}`);
  redirect(`/admin/lessons/${lesson.id}`);
}

async function createLessonSectionForNewLesson(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  lessonId: string
) {
  await insertAndSelectSingle<LessonSectionRow>(supabase, "lesson_sections", {
    lesson_id: lessonId,
    title: "Main section",
    position: 1
  });
}

export async function updateLessonAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const lessonId = getString(formData, "lessonId");
  const payload: LessonUpdate = {
    title: getString(formData, "title").trim() || "Untitled lesson",
    content_markdown: getString(formData, "contentMarkdown"),
    task_prompt: getString(formData, "taskPrompt").trim() || null,
    video_url: getString(formData, "videoUrl").trim() || null,
    is_published: isChecked(formData, "isPublished")
  };

  await assertNoMutationError(
    await updateWhereEq(supabase, "lessons", payload, {
      column: "id",
      value: lessonId
    })
  );

  const { data: lesson } = await selectMaybeSingle<LessonRow>(supabase, "lessons", "*", {
    column: "id",
    value: lessonId
  });

  if (lesson) {
    revalidatePath(`/admin/courses/${lesson.course_id}`);
    revalidatePath(`/course/${lesson.course_id}`);
    revalidatePath(`/course/${lesson.course_id}/${lesson.id}`);
  }

  revalidatePath(`/admin/lessons/${lessonId}`);
}

export async function reorderLessonsAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = getString(formData, "courseId");
  const orderedIds = parseOrderedIds(formData);
  const { data: lessons } = await selectRows<LessonRow>(supabase, "lessons", "*", {
    filters: [{ column: "course_id", value: courseId }],
    orderBy: { column: "position", ascending: true }
  });

  if (lessons.length > 1 && orderedIds.length === lessons.length) {
    await reorderByIds(supabase, "lessons", lessons, orderedIds);
  }

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/course/${courseId}`);
}

export async function createLessonSectionAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const lessonId = getString(formData, "lessonId");
  assertMutationSucceeded(
    await insertAndSelectSingle<LessonSectionRow>(supabase, "lesson_sections", {
      lesson_id: lessonId,
      title: getString(formData, "title").trim() || "Untitled section",
      position: await getNextSectionPosition(supabase, lessonId)
    } satisfies LessonSectionInsert),
    "Lesson section creation did not return a row."
  );

  const { data: lesson } = await selectMaybeSingle<LessonRow>(supabase, "lessons", "*", {
    column: "id",
    value: lessonId
  });

  if (lesson) {
    revalidatePath(`/admin/lessons/${lessonId}`);
    revalidatePath(`/course/${lesson.course_id}/${lesson.id}`);
  }
}

export async function updateLessonSectionAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const sectionId = getString(formData, "sectionId");
  const lessonId = getString(formData, "lessonId");
  const payload: LessonSectionUpdate = {
    title: getString(formData, "title").trim() || "Untitled section"
  };

  await assertNoMutationError(
    await updateWhereEq(supabase, "lesson_sections", payload, {
      column: "id",
      value: sectionId
    })
  );

  const { data: lesson } = await selectMaybeSingle<LessonRow>(supabase, "lessons", "*", {
    column: "id",
    value: lessonId
  });

  if (lesson) {
    revalidatePath(`/admin/lessons/${lesson.id}`);
    revalidatePath(`/course/${lesson.course_id}/${lesson.id}`);
  }
}

export async function reorderLessonSectionsAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const lessonId = getString(formData, "lessonId");
  const orderedIds = parseOrderedIds(formData);
  const { data: sections } = await selectRows<LessonSectionRow>(supabase, "lesson_sections", "*", {
    filters: [{ column: "lesson_id", value: lessonId }],
    orderBy: { column: "position", ascending: true }
  });

  if (sections.length > 1 && orderedIds.length === sections.length) {
    await reorderByIds(supabase, "lesson_sections", sections, orderedIds);
  }

  revalidatePath(`/admin/lessons/${lessonId}`);
}

export async function createLessonBlockAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const lessonId = getString(formData, "lessonId");
  const sectionId = getString(formData, "sectionId");
  const blockType = formData.get("blockType") as LessonBlockRow["type"] | null;
  const requestedPosition = Number(formData.get("position") ?? "");
  const existingBlocks = await getSectionBlocks(supabase, sectionId);
  const insertPosition =
    Number.isFinite(requestedPosition) && requestedPosition > 0
      ? Math.min(Math.max(1, requestedPosition), existingBlocks.length + 1)
      : await getNextBlockPosition(supabase, sectionId);

  if (insertPosition <= existingBlocks.length) {
    await shiftBlockPositions(supabase, sectionId, insertPosition);
  }

  assertMutationSucceeded(
    await insertAndSelectSingle<LessonBlockRow>(supabase, "lesson_blocks", {
      lesson_id: lessonId,
      lesson_section_id: sectionId,
      type: blockType ?? "paragraph",
      content: getString(formData, "content").trim() || null,
      url: getString(formData, "url").trim() || null,
      caption: getString(formData, "caption").trim() || null,
      position: insertPosition
    } satisfies LessonBlockInsert),
    "Lesson block creation did not return a row."
  );

  const { data: lesson } = await selectMaybeSingle<LessonRow>(supabase, "lessons", "*", {
    column: "id",
    value: lessonId
  });

  if (lesson) {
    revalidatePath(`/admin/lessons/${lessonId}`);
    revalidatePath(`/course/${lesson.course_id}/${lesson.id}`);
  }
}

export async function updateLessonBlockAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const blockId = getString(formData, "blockId");
  const lessonId = getString(formData, "lessonId");
  const sectionId = getString(formData, "sectionId");
  const payload: LessonBlockUpdate = {
    lesson_section_id: sectionId,
    type: (formData.get("blockType") as LessonBlockRow["type"] | null) ?? "paragraph",
    content: getString(formData, "content").trim() || null,
    url: getString(formData, "url").trim() || null,
    caption: getString(formData, "caption").trim() || null
  };

  await assertNoMutationError(
    await updateWhereEq(supabase, "lesson_blocks", payload, {
      column: "id",
      value: blockId
    })
  );

  const { data: lesson } = await selectMaybeSingle<LessonRow>(supabase, "lessons", "*", {
    column: "id",
    value: lessonId
  });

  if (lesson) {
    revalidatePath(`/admin/lessons/${lessonId}`);
    revalidatePath(`/course/${lesson.course_id}/${lesson.id}`);
  }
}

export async function deleteLessonBlockAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const blockId = getString(formData, "blockId");
  const lessonId = getString(formData, "lessonId");
  const { data: block } = await selectMaybeSingle<LessonBlockRow>(supabase, "lesson_blocks", "*", {
    column: "id",
    value: blockId
  });

  await assertNoMutationError(
    await deleteWhereEq(supabase, "lesson_blocks", {
      column: "id",
      value: blockId
    })
  );

  const { data: lesson } = await selectMaybeSingle<LessonRow>(supabase, "lessons", "*", {
    column: "id",
    value: lessonId
  });

  if (lesson) {
    if (block) {
      await normalizeBlockPositions(supabase, block.lesson_section_id);
    }
    revalidatePath(`/admin/lessons/${lessonId}`);
    revalidatePath(`/course/${lesson.course_id}/${lesson.id}`);
  }
}

export async function duplicateLessonBlockAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const blockId = getString(formData, "blockId");
  const lessonId = getString(formData, "lessonId");
  const { data: block } = await selectMaybeSingle<LessonBlockRow>(supabase, "lesson_blocks", "*", {
    column: "id",
    value: blockId
  });

  if (!block) {
    return;
  }

  const insertPosition = block.position + 1;
  await shiftBlockPositions(supabase, block.lesson_section_id, insertPosition);
  assertMutationSucceeded(
    await insertAndSelectSingle<LessonBlockRow>(supabase, "lesson_blocks", {
      lesson_id: block.lesson_id,
      lesson_section_id: block.lesson_section_id,
      type: block.type,
      content: block.content,
      url: block.url,
      caption: block.caption,
      position: insertPosition
    } satisfies LessonBlockInsert),
    "Lesson block duplication did not return a row."
  );

  const { data: lesson } = await selectMaybeSingle<LessonRow>(supabase, "lessons", "*", {
    column: "id",
    value: lessonId
  });

  if (lesson) {
    revalidatePath(`/admin/lessons/${lessonId}`);
    revalidatePath(`/course/${lesson.course_id}/${lesson.id}`);
  }
}

export async function reorderLessonBlocksAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const lessonId = getString(formData, "lessonId");
  const sectionId = getString(formData, "sectionId");
  const orderedIds = parseOrderedIds(formData);
  const { data: blocks } = await selectRows<LessonBlockRow>(supabase, "lesson_blocks", "*", {
    filters: [{ column: "lesson_section_id", value: sectionId }],
    orderBy: { column: "position", ascending: true }
  });

  if (blocks.length > 1 && orderedIds.length === blocks.length) {
    await reorderByIds(supabase, "lesson_blocks", blocks, orderedIds);
  }

  revalidatePath(`/admin/lessons/${lessonId}`);
}
