import { notFound } from "next/navigation";

import {
  buildCourseLessonSummaries,
  buildCourseSummaries,
  calculateProgress,
  findNextLessonHref,
  type CourseLessonSummary,
  type CourseSummary
} from "@/lib/course-rules";
import { getRenderableLessonBlocks, type LessonBlockRow } from "@/lib/lesson-blocks";
import { selectMaybeSingle, selectRows, upsertRow } from "@/lib/supabase/query-helpers";
import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonSectionRow = Database["public"]["Tables"]["lesson_sections"]["Row"];
type LessonProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];
type LessonProgressInsert = Database["public"]["Tables"]["lesson_progress"]["Insert"];
type LessonSubmissionRow = Database["public"]["Tables"]["lesson_submissions"]["Row"];
type LessonSubmissionInsert = Database["public"]["Tables"]["lesson_submissions"]["Insert"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type QueryClient = Parameters<typeof selectRows<unknown>>[0];
type RowResult<T> = { data: T[] };

export type CourseOverview = {
  course: CourseRow;
  lessons: CourseLessonSummary[];
  progressPercentage: number;
  totalLessons: number;
  completedLessons: number;
};

export type LessonPageData = {
  course: CourseRow;
  lesson: LessonRow;
  lessons: LessonRow[];
  sections: LessonSectionRow[];
  blocksBySectionId: Map<string, LessonBlockRow[]>;
  progressByLessonId: Map<string, LessonProgressRow>;
  submission: LessonSubmissionRow | null;
  nextLessonHref: string | null;
};

export type AdminCourseData = {
  course: CourseRow;
  lessons: LessonRow[];
  sectionsByLessonId: Map<string, LessonSectionRow[]>;
  blocksBySectionId: Map<string, LessonBlockRow[]>;
};

export type AdminLessonWorkspaceData = {
  course: CourseRow;
  lesson: LessonRow;
  lessons: LessonRow[];
  sections: LessonSectionRow[];
  sectionsByLessonId: Map<string, LessonSectionRow[]>;
  blocksBySectionId: Map<string, LessonBlockRow[]>;
};

function mapRowsByKey<Row, Key extends string | number>(
  rows: Row[],
  getKey: (row: Row) => Key
) {
  const map = new Map<Key, Row[]>();

  rows.forEach((row) => {
    const key = getKey(row);
    const group = map.get(key) ?? [];
    group.push(row);
    map.set(key, group);
  });

  return map;
}

async function getPublishedCourse(
  supabase: QueryClient,
  courseId: string
) {
  const { data: course } = await selectMaybeSingle<CourseRow>(supabase, "courses", "*", {
    column: "id",
    value: courseId
  });

  if (!course || !course.is_published) {
    notFound();
  }

  return course;
}

export async function getUserSubscription(
  supabase: QueryClient,
  userId: string
): Promise<SubscriptionRow | null> {
  const { data } = await selectMaybeSingle<SubscriptionRow>(supabase, "subscriptions", "*", {
    column: "user_id",
    value: userId
  });

  return data;
}

export async function getPublishedCourseSummaries(
  supabase: QueryClient,
  userId: string
): Promise<CourseSummary[]> {
  const { data: courses } = await selectRows<CourseRow>(supabase, "courses", "*", {
    filters: [{ column: "is_published", value: "true" }]
  });

  if (courses.length === 0) {
    return [];
  }

  const courseIds = courses.map((course) => course.id);
  const { data: lessons } = await selectRows<LessonRow>(supabase, "lessons", "*", {
    inFilters: [{ column: "course_id", values: courseIds }],
    filters: [{ column: "is_published", value: "true" }],
    orderBy: { column: "position", ascending: true }
  });
  const lessonIds = lessons.map((lesson) => lesson.id);
  const { data: progressRows } = await selectRows<LessonProgressRow>(supabase, "lesson_progress", "*", {
    filters: [{ column: "user_id", value: userId }],
    inFilters: lessonIds.length > 0 ? [{ column: "lesson_id", values: lessonIds }] : []
  });

  return buildCourseSummaries({
    courses,
    lessons,
    progressRows
  });
}

export async function getCourseOverview(
  supabase: QueryClient,
  userId: string,
  courseId: string
): Promise<CourseOverview> {
  const course = await getPublishedCourse(supabase, courseId);
  const { data: lessons } = await selectRows<LessonRow>(supabase, "lessons", "*", {
    filters: [
      { column: "course_id", value: courseId },
      { column: "is_published", value: "true" }
    ],
    orderBy: { column: "position", ascending: true }
  });
  const lessonIds = lessons.map((lesson) => lesson.id);
  const { data: sections } =
    lessonIds.length > 0
      ? await selectRows<LessonSectionRow>(supabase, "lesson_sections", "*", {
          inFilters: [{ column: "lesson_id", values: lessonIds }],
          orderBy: { column: "position", ascending: true }
        })
      : ({ data: [] } as RowResult<LessonSectionRow>);
  const { data: progressRows } = await selectRows<LessonProgressRow>(supabase, "lesson_progress", "*", {
    filters: [{ column: "user_id", value: userId }],
    inFilters: lessonIds.length > 0 ? [{ column: "lesson_id", values: lessonIds }] : []
  });

  const lessonSummaries = buildCourseLessonSummaries({
    lessons,
    sections,
    progressRows
  });
  const completedLessons = lessonSummaries.filter((entry) => entry.completionState === "completed").length;

  return {
    course,
    lessons: lessonSummaries,
    progressPercentage: calculateProgress(lessonSummaries.length, completedLessons),
    totalLessons: lessonSummaries.length,
    completedLessons
  };
}

export async function getLessonPageData(
  supabase: QueryClient,
  userId: string,
  courseId: string,
  lessonId: string
): Promise<LessonPageData> {
  const course = await getPublishedCourse(supabase, courseId);
  const { data: lessons } = await selectRows<LessonRow>(supabase, "lessons", "*", {
    filters: [
      { column: "course_id", value: course.id },
      { column: "is_published", value: "true" }
    ],
    orderBy: { column: "position", ascending: true }
  });
  const lesson = lessons.find((entry) => entry.id === lessonId);

  if (!lesson) {
    notFound();
  }

  const lessonIds = lessons.map((entry) => entry.id);
  const { data: sections } = await selectRows<LessonSectionRow>(supabase, "lesson_sections", "*", {
    inFilters: [{ column: "lesson_id", values: [lesson.id] }],
    orderBy: { column: "position", ascending: true }
  });
  const sectionIds = sections.map((section) => section.id);
  const { data: blockRows } =
    sectionIds.length > 0
      ? await selectRows<LessonBlockRow>(supabase, "lesson_blocks", "*", {
          inFilters: [{ column: "lesson_section_id", values: sectionIds }],
          orderBy: { column: "position", ascending: true }
        })
      : ({ data: [] } as RowResult<LessonBlockRow>);
  const blocksBySectionId = mapRowsByKey(blockRows, (row) => row.lesson_section_id);

  if (blockRows.length === 0 && sections[0]) {
    blocksBySectionId.set(sections[0].id, getRenderableLessonBlocks(lesson, []));
  }

  const { data: progressRows } = await selectRows<LessonProgressRow>(supabase, "lesson_progress", "*", {
    filters: [{ column: "user_id", value: userId }],
    inFilters: lessonIds.length > 0 ? [{ column: "lesson_id", values: lessonIds }] : []
  });
  const progressByLessonId = new Map(progressRows.map((row) => [row.lesson_id, row]));
  const { data: submissionRows } = await selectRows<LessonSubmissionRow>(
    supabase,
    "lesson_submissions",
    "*",
    {
      filters: [{ column: "user_id", value: userId }],
      inFilters: [{ column: "lesson_id", values: [lesson.id] }]
    }
  );

  return {
    course,
    lesson,
    lessons,
    sections,
    blocksBySectionId,
    progressByLessonId,
    submission: submissionRows[0] ?? null,
    nextLessonHref: findNextLessonHref({
      courseId,
      lessons,
      currentLessonId: lesson.id
    })
  };
}

export async function ensureLessonStarted(
  supabase: QueryClient,
  userId: string,
  lessonId: string
) {
  const existingRows = await selectRows<LessonProgressRow>(supabase, "lesson_progress", "*", {
    filters: [{ column: "user_id", value: userId }],
    inFilters: [{ column: "lesson_id", values: [lessonId] }]
  });
  const existing = existingRows.data[0] ?? null;

  if (existing?.state === "completed") {
    return existing;
  }

  const payload: LessonProgressInsert = {
    user_id: userId,
    lesson_id: lessonId,
    state: "in_progress",
    started_at: existing?.started_at ?? new Date().toISOString(),
    last_viewed_at: new Date().toISOString(),
    completed_at: existing?.completed_at ?? null
  };

  await upsertRow(supabase, "lesson_progress", payload, {
    onConflict: "user_id,lesson_id"
  });

  return payload;
}

export async function completeLesson(
  supabase: QueryClient,
  userId: string,
  lessonId: string,
  submissionText?: string
) {
  const timestamp = new Date().toISOString();
  const progressPayload: LessonProgressInsert = {
    user_id: userId,
    lesson_id: lessonId,
    state: "completed",
    started_at: timestamp,
    last_viewed_at: timestamp,
    completed_at: timestamp
  };

  await upsertRow(supabase, "lesson_progress", progressPayload, {
    onConflict: "user_id,lesson_id"
  });

  if (submissionText && submissionText.trim().length > 0) {
    const submissionPayload: LessonSubmissionInsert = {
      user_id: userId,
      lesson_id: lessonId,
      submission_text: submissionText.trim()
    };

    await upsertRow(supabase, "lesson_submissions", submissionPayload, {
      onConflict: "user_id,lesson_id"
    });
  }
}

export async function getAdminCourseData(
  supabase: QueryClient,
  courseId: string
): Promise<AdminCourseData> {
  const { data: course } = await selectMaybeSingle<CourseRow>(supabase, "courses", "*", {
    column: "id",
    value: courseId
  });

  if (!course) {
    notFound();
  }

  const { data: lessons } = await selectRows<LessonRow>(supabase, "lessons", "*", {
    filters: [{ column: "course_id", value: courseId }],
    orderBy: { column: "position", ascending: true }
  });
  const lessonIds = lessons.map((lesson) => lesson.id);
  const { data: sections } =
    lessonIds.length > 0
      ? await selectRows<LessonSectionRow>(supabase, "lesson_sections", "*", {
          inFilters: [{ column: "lesson_id", values: lessonIds }],
          orderBy: { column: "position", ascending: true }
        })
      : ({ data: [] } as RowResult<LessonSectionRow>);
  const sectionIds = sections.map((section) => section.id);
  const { data: blocks } =
    sectionIds.length > 0
      ? await selectRows<LessonBlockRow>(supabase, "lesson_blocks", "*", {
          inFilters: [{ column: "lesson_section_id", values: sectionIds }],
          orderBy: { column: "position", ascending: true }
        })
      : ({ data: [] } as RowResult<LessonBlockRow>);

  return {
    course,
    lessons,
    sectionsByLessonId: mapRowsByKey(sections, (row) => row.lesson_id),
    blocksBySectionId: mapRowsByKey(blocks, (row) => row.lesson_section_id)
  };
}

export async function getAdminCourses(
  supabase: QueryClient
): Promise<Array<CourseSummary & { lessonCount: number }>> {
  const { data: courses } = await selectRows<CourseRow>(supabase, "courses", "*", {
    orderBy: { column: "created_at", ascending: true }
  });
  const courseIds = courses.map((course) => course.id);
  const { data: lessons } =
    courseIds.length > 0
      ? await selectRows<LessonRow>(supabase, "lessons", "*", {
          inFilters: [{ column: "course_id", values: courseIds }]
        })
      : ({ data: [] } as RowResult<LessonRow>);

  return courses.map((course) => ({
    course,
    progressPercentage: 0,
    totalLessons: 0,
    completedLessons: 0,
    resumeHref: null,
    lessonCount: lessons.filter((lesson) => lesson.course_id === course.id).length
  }));
}

export async function getAdminLessonWorkspaceData(
  supabase: QueryClient,
  lessonId: string
): Promise<AdminLessonWorkspaceData> {
  const { data: lesson } = await selectMaybeSingle<LessonRow>(supabase, "lessons", "*", {
    column: "id",
    value: lessonId
  });

  if (!lesson) {
    notFound();
  }

  const courseData = await getAdminCourseData(supabase, lesson.course_id);
  const currentLesson = courseData.lessons.find((entry) => entry.id === lessonId);

  if (!currentLesson) {
    notFound();
  }

  const sections = courseData.sectionsByLessonId.get(lessonId) ?? [];

  return {
    course: courseData.course,
    lesson: currentLesson,
    lessons: courseData.lessons,
    sections,
    sectionsByLessonId: courseData.sectionsByLessonId,
    blocksBySectionId: courseData.blocksBySectionId
  };
}
