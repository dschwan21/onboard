import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type ModuleRow = Database["public"]["Tables"]["modules"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];

export type CourseSummary = {
  course: CourseRow;
  progressPercentage: number;
  totalLessons: number;
  completedLessons: number;
  resumeHref: string | null;
};

export type CourseModuleSummary = {
  module: ModuleRow;
  lessons: LessonRow[];
  lessonCount: number;
  completionCount: number;
  locked: boolean;
};

export function hasActiveSubscription(status?: string | null) {
  return status === "active" || status === "trialing";
}

export function calculateProgress(totalLessons: number, completedLessons: number) {
  if (totalLessons === 0) {
    return 0;
  }

  return Math.round((completedLessons / totalLessons) * 100);
}

export function buildLessonHref(courseId: string, moduleId: string, lessonId: string) {
  return `/course/${courseId}/${moduleId}/${lessonId}`;
}

export function sortModules(modules: ModuleRow[]) {
  return [...modules].sort((a, b) => a.position - b.position);
}

export function sortLessons(lessons: LessonRow[]) {
  return [...lessons].sort((a, b) => a.position - b.position);
}

export function buildCourseSummaries(params: {
  courses: CourseRow[];
  modules: ModuleRow[];
  lessons: LessonRow[];
  progressRows: LessonProgressRow[];
  hasProAccess: boolean;
}): CourseSummary[] {
  const { courses, modules, lessons, progressRows, hasProAccess } = params;
  const progressByLessonId = new Map(progressRows.map((row) => [row.lesson_id, row]));
  const modulesByCourseId = new Map<string, ModuleRow[]>();
  const lessonsByModuleId = new Map<string, LessonRow[]>();

  modules.forEach((module) => {
    const group = modulesByCourseId.get(module.course_id) ?? [];
    group.push(module);
    modulesByCourseId.set(module.course_id, group);
  });

  lessons.forEach((lesson) => {
    const group = lessonsByModuleId.get(lesson.module_id) ?? [];
    group.push(lesson);
    lessonsByModuleId.set(lesson.module_id, group);
  });

  return courses.map((course) => {
    const orderedModules = sortModules(modulesByCourseId.get(course.id) ?? []);
    const orderedLessons = orderedModules.flatMap((module) =>
      sortLessons(lessonsByModuleId.get(module.id) ?? [])
    );
    const accessibleLessons = orderedModules.flatMap((module) => {
      if (module.is_pro && !hasProAccess) {
        return [];
      }

      return sortLessons(lessonsByModuleId.get(module.id) ?? []);
    });
    const completedLessons = orderedLessons.filter(
      (lesson) => progressByLessonId.get(lesson.id)?.state === "completed"
    ).length;
    const resumeLesson =
      accessibleLessons.find(
        (lesson) => progressByLessonId.get(lesson.id)?.state !== "completed"
      ) ?? accessibleLessons[0];

    return {
      course,
      progressPercentage: calculateProgress(orderedLessons.length, completedLessons),
      totalLessons: orderedLessons.length,
      completedLessons,
      resumeHref: resumeLesson
        ? buildLessonHref(course.id, resumeLesson.module_id, resumeLesson.id)
        : null
    };
  });
}

export function buildCourseModuleSummaries(params: {
  modules: Array<{ module: ModuleRow; lessons: LessonRow[] }>;
  progressRows: LessonProgressRow[];
  hasProAccess: boolean;
}): CourseModuleSummary[] {
  const { modules, progressRows, hasProAccess } = params;
  const progressByLessonId = new Map(progressRows.map((row) => [row.lesson_id, row]));

  return modules.map(({ module, lessons }) => ({
    module,
    lessons,
    lessonCount: lessons.length,
    completionCount: lessons.filter(
      (lesson) => progressByLessonId.get(lesson.id)?.state === "completed"
    ).length,
    locked: module.is_pro && !hasProAccess
  }));
}

export function findNextLessonHref(params: {
  courseId: string;
  modules: CourseModuleSummary[];
  currentLessonId: string;
}): string | null {
  const { courseId, modules, currentLessonId } = params;
  const accessibleLessons = modules.flatMap((entry) => (entry.locked ? [] : entry.lessons));
  const currentIndex = accessibleLessons.findIndex((lesson) => lesson.id === currentLessonId);
  const nextLesson = currentIndex >= 0 ? accessibleLessons[currentIndex + 1] : null;

  return nextLesson ? buildLessonHref(courseId, nextLesson.module_id, nextLesson.id) : null;
}
