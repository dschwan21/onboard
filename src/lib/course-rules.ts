import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonSectionRow = Database["public"]["Tables"]["lesson_sections"]["Row"];
type LessonProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];

export type CourseSummary = {
  course: CourseRow;
  progressPercentage: number;
  totalLessons: number;
  completedLessons: number;
  resumeHref: string | null;
};

export type CourseLessonSummary = {
  lesson: LessonRow;
  sections: LessonSectionRow[];
  sectionCount: number;
  completionState: "not_started" | "in_progress" | "completed";
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

export function buildLessonHref(courseId: string, lessonId: string) {
  return `/course/${courseId}/${lessonId}`;
}

export function sortLessons(lessons: LessonRow[]) {
  return [...lessons].sort((a, b) => a.position - b.position);
}

export function sortSections(sections: LessonSectionRow[]) {
  return [...sections].sort((a, b) => a.position - b.position);
}

export function buildCourseSummaries(params: {
  courses: CourseRow[];
  lessons: LessonRow[];
  progressRows: LessonProgressRow[];
}): CourseSummary[] {
  const { courses, lessons, progressRows } = params;
  const progressByLessonId = new Map(progressRows.map((row) => [row.lesson_id, row]));
  const lessonsByCourseId = new Map<string, LessonRow[]>();

  lessons.forEach((lesson) => {
    const group = lessonsByCourseId.get(lesson.course_id) ?? [];
    group.push(lesson);
    lessonsByCourseId.set(lesson.course_id, group);
  });

  return courses.map((course) => {
    const orderedLessons = sortLessons(lessonsByCourseId.get(course.id) ?? []);
    const completedLessons = orderedLessons.filter(
      (lesson) => progressByLessonId.get(lesson.id)?.state === "completed"
    ).length;
    const resumeLesson =
      orderedLessons.find((lesson) => progressByLessonId.get(lesson.id)?.state !== "completed") ??
      orderedLessons[0];

    return {
      course,
      progressPercentage: calculateProgress(orderedLessons.length, completedLessons),
      totalLessons: orderedLessons.length,
      completedLessons,
      resumeHref: resumeLesson ? buildLessonHref(course.id, resumeLesson.id) : null
    };
  });
}

export function buildCourseLessonSummaries(params: {
  lessons: LessonRow[];
  sections: LessonSectionRow[];
  progressRows: LessonProgressRow[];
}): CourseLessonSummary[] {
  const { lessons, sections, progressRows } = params;
  const progressByLessonId = new Map(progressRows.map((row) => [row.lesson_id, row]));
  const sectionsByLessonId = new Map<string, LessonSectionRow[]>();

  sections.forEach((section) => {
    const group = sectionsByLessonId.get(section.lesson_id) ?? [];
    group.push(section);
    sectionsByLessonId.set(section.lesson_id, group);
  });

  return sortLessons(lessons).map((lesson) => ({
    lesson,
    sections: sortSections(sectionsByLessonId.get(lesson.id) ?? []),
    sectionCount: (sectionsByLessonId.get(lesson.id) ?? []).length,
    completionState: progressByLessonId.get(lesson.id)?.state ?? "not_started"
  }));
}

export function findNextLessonHref(params: {
  courseId: string;
  lessons: LessonRow[];
  currentLessonId: string;
}): string | null {
  const { courseId, lessons, currentLessonId } = params;
  const orderedLessons = sortLessons(lessons);
  const currentIndex = orderedLessons.findIndex((lesson) => lesson.id === currentLessonId);
  const nextLesson = currentIndex >= 0 ? orderedLessons[currentIndex + 1] : null;

  return nextLesson ? buildLessonHref(courseId, nextLesson.id) : null;
}
