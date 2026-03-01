import { notFound } from "next/navigation";

import {
  buildCourseModuleSummaries,
  buildCourseSummaries,
  calculateProgress,
  findNextLessonHref,
  hasActiveSubscription,
  type CourseModuleSummary,
  type CourseSummary
} from "@/lib/course-rules";
import { selectMaybeSingle, selectRows, upsertRow } from "@/lib/supabase/query-helpers";
import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type ModuleRow = Database["public"]["Tables"]["modules"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];
type LessonProgressInsert = Database["public"]["Tables"]["lesson_progress"]["Insert"];
type LessonSubmissionRow = Database["public"]["Tables"]["lesson_submissions"]["Row"];
type LessonSubmissionInsert = Database["public"]["Tables"]["lesson_submissions"]["Insert"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type QueryClient = Parameters<typeof selectRows<unknown>>[0];
type RowResult<T> = {
  data: T[];
};

export type CourseOverview = {
  course: CourseRow;
  modules: CourseModuleSummary[];
  progressPercentage: number;
  totalLessons: number;
  completedLessons: number;
  hasProAccess: boolean;
};

export type LessonPageData = {
  course: CourseRow;
  module: ModuleRow;
  lesson: LessonRow;
  lessonsInModule: LessonRow[];
  progressByLessonId: Map<string, LessonProgressRow>;
  submission: LessonSubmissionRow | null;
  nextLessonHref: string | null;
  hasProAccess: boolean;
};

type CourseTree = {
  course: CourseRow;
  modules: Array<{
    module: ModuleRow;
    lessons: LessonRow[];
  }>;
};

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
  const { data: modules } = await selectRows<ModuleRow>(supabase, "modules", "*", {
    inFilters: [{ column: "course_id", values: courseIds }],
    orderBy: { column: "position", ascending: true }
  });
  const moduleIds = modules.map((module) => module.id);
  const emptyLessons: RowResult<LessonRow> = { data: [] };
  const { data: lessons } =
    moduleIds.length > 0
      ? await selectRows<LessonRow>(supabase, "lessons", "*", {
          inFilters: [{ column: "module_id", values: moduleIds }],
          filters: [{ column: "is_published", value: "true" }],
          orderBy: { column: "position", ascending: true }
        })
      : emptyLessons;
  const lessonIds = lessons.map((lesson) => lesson.id);
  const { data: progressRows } = await selectRows<LessonProgressRow>(supabase, "lesson_progress", "*", {
    filters: [{ column: "user_id", value: userId }],
    inFilters: lessonIds.length > 0 ? [{ column: "lesson_id", values: lessonIds }] : []
  });
  const subscription = await getUserSubscription(supabase, userId);
  const hasProAccess = hasActiveSubscription(subscription?.status);

  return buildCourseSummaries({
    courses,
    modules,
    lessons,
    progressRows,
    hasProAccess
  });
}

async function getPublishedCourseTree(
  supabase: QueryClient,
  courseId: string
): Promise<CourseTree> {
  const { data: course } = await selectMaybeSingle<CourseRow>(supabase, "courses", "*", {
    column: "id",
    value: courseId
  });

  if (!course || !course.is_published) {
    notFound();
  }

  const { data: modules } = await selectRows<ModuleRow>(supabase, "modules", "*", {
    filters: [{ column: "course_id", value: courseId }],
    orderBy: { column: "position", ascending: true }
  });
  const moduleIds = modules.map((module) => module.id);
  const emptyLessons: RowResult<LessonRow> = { data: [] };
  const { data: lessons } =
    moduleIds.length > 0
      ? await selectRows<LessonRow>(supabase, "lessons", "*", {
          inFilters: [{ column: "module_id", values: moduleIds }],
          filters: [{ column: "is_published", value: "true" }],
          orderBy: { column: "position", ascending: true }
        })
      : emptyLessons;
  const lessonsByModuleId = new Map<string, LessonRow[]>();

  lessons.forEach((lesson) => {
    const moduleLessons = lessonsByModuleId.get(lesson.module_id) ?? [];
    moduleLessons.push(lesson);
    lessonsByModuleId.set(lesson.module_id, moduleLessons);
  });

  return {
    course,
    modules: modules.map((module) => ({
      module,
      lessons: (lessonsByModuleId.get(module.id) ?? []).sort((a, b) => a.position - b.position)
    }))
  };
}

export async function getCourseOverview(
  supabase: QueryClient,
  userId: string,
  courseId: string
): Promise<CourseOverview> {
  const tree = await getPublishedCourseTree(supabase, courseId);
  const lessonIds = tree.modules.flatMap((entry) => entry.lessons.map((lesson) => lesson.id));
  const { data: progressRows } = await selectRows<LessonProgressRow>(supabase, "lesson_progress", "*", {
    filters: [{ column: "user_id", value: userId }],
    inFilters: lessonIds.length > 0 ? [{ column: "lesson_id", values: lessonIds }] : []
  });
  const subscription = await getUserSubscription(supabase, userId);
  const hasProAccess = hasActiveSubscription(subscription?.status);
  const modules = buildCourseModuleSummaries({
    modules: tree.modules,
    progressRows,
    hasProAccess
  });

  const totalLessons = modules.reduce((sum, module) => sum + module.lessonCount, 0);
  const completedLessons = modules.reduce((sum, module) => sum + module.completionCount, 0);

  return {
    course: tree.course,
    modules,
    progressPercentage: calculateProgress(totalLessons, completedLessons),
    totalLessons,
    completedLessons,
    hasProAccess
  };
}

export async function getLessonPageData(
  supabase: QueryClient,
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string
): Promise<LessonPageData> {
  const overview = await getCourseOverview(supabase, userId, courseId);
  const moduleSummary = overview.modules.find((entry) => entry.module.id === moduleId);

  if (!moduleSummary) {
    notFound();
  }

  const lesson = moduleSummary.lessons.find((item) => item.id === lessonId);

  if (!lesson) {
    notFound();
  }

  const { data: progressRows } = await selectRows<LessonProgressRow>(supabase, "lesson_progress", "*", {
    filters: [{ column: "user_id", value: userId }],
    inFilters: [{ column: "lesson_id", values: moduleSummary.lessons.map((item) => item.id) }]
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
  const submission = submissionRows[0] ?? null;

  return {
    course: overview.course,
    module: moduleSummary.module,
    lesson,
    lessonsInModule: moduleSummary.lessons,
    progressByLessonId,
    submission: submission?.user_id === userId ? submission : null,
    nextLessonHref: findNextLessonHref({
      courseId,
      modules: overview.modules,
      currentLessonId: lesson.id
    }),
    hasProAccess: overview.hasProAccess
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
): Promise<CourseTree> {
  const { data: course } = await selectMaybeSingle<CourseRow>(supabase, "courses", "*", {
    column: "id",
    value: courseId
  });

  if (!course) {
    notFound();
  }

  const { data: modules } = await selectRows<ModuleRow>(supabase, "modules", "*", {
    filters: [{ column: "course_id", value: courseId }],
    orderBy: { column: "position", ascending: true }
  });
  const moduleIds = modules.map((module) => module.id);
  const emptyLessons: RowResult<LessonRow> = { data: [] };
  const { data: lessons } =
    moduleIds.length > 0
      ? await selectRows<LessonRow>(supabase, "lessons", "*", {
          inFilters: [{ column: "module_id", values: moduleIds }],
          orderBy: { column: "position", ascending: true }
        })
      : emptyLessons;
  const lessonsByModuleId = new Map<string, LessonRow[]>();

  lessons.forEach((lesson) => {
    const moduleLessons = lessonsByModuleId.get(lesson.module_id) ?? [];
    moduleLessons.push(lesson);
    lessonsByModuleId.set(lesson.module_id, moduleLessons);
  });

  return {
    course,
    modules: modules.map((module) => ({
      module,
      lessons: (lessonsByModuleId.get(module.id) ?? []).sort((a, b) => a.position - b.position)
    }))
  };
}

export async function getAdminCourses(
  supabase: QueryClient
): Promise<Array<CourseSummary & { moduleCount: number }>> {
  const { data: courses } = await selectRows<CourseRow>(supabase, "courses", "*", {
    orderBy: { column: "created_at", ascending: true }
  });
  const courseIds = courses.map((course) => course.id);
  const { data: modules } = await selectRows<ModuleRow>(supabase, "modules", "*", {
    inFilters: courseIds.length > 0 ? [{ column: "course_id", values: courseIds }] : []
  });

  return courses.map((course) => ({
    course,
    progressPercentage: 0,
    totalLessons: 0,
    completedLessons: 0,
    resumeHref: null,
    moduleCount: modules.filter((module) => module.course_id === course.id).length
  }));
}
