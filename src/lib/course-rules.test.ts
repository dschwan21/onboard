import {
  buildCourseModuleSummaries,
  buildCourseSummaries,
  buildLessonHref,
  calculateProgress,
  findNextLessonHref,
  hasActiveSubscription
} from "@/lib/course-rules";
import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type ModuleRow = Database["public"]["Tables"]["modules"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];

const course: CourseRow = {
  id: "course-1",
  title: "AI Foundations",
  slug: "ai-foundations",
  description: "Learn the basics",
  is_published: true,
  created_at: "2026-03-01T00:00:00.000Z"
};

const modules: ModuleRow[] = [
  {
    id: "module-1",
    course_id: "course-1",
    title: "Step 1",
    position: 1,
    is_pro: false,
    created_at: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "module-2",
    course_id: "course-1",
    title: "Step 2",
    position: 2,
    is_pro: true,
    created_at: "2026-03-01T00:00:00.000Z"
  }
];

const lessons: LessonRow[] = [
  {
    id: "lesson-1",
    module_id: "module-1",
    title: "Lesson 1",
    content_markdown: "Intro",
    task_prompt: null,
    video_url: null,
    is_published: true,
    position: 1,
    created_at: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "lesson-2",
    module_id: "module-1",
    title: "Lesson 2",
    content_markdown: "Practice",
    task_prompt: null,
    video_url: null,
    is_published: true,
    position: 2,
    created_at: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "lesson-3",
    module_id: "module-2",
    title: "Lesson 3",
    content_markdown: "Advanced",
    task_prompt: null,
    video_url: null,
    is_published: true,
    position: 1,
    created_at: "2026-03-01T00:00:00.000Z"
  }
];

const progressRows: LessonProgressRow[] = [
  {
    id: "progress-1",
    user_id: "user-1",
    lesson_id: "lesson-1",
    state: "completed",
    started_at: "2026-03-01T00:00:00.000Z",
    last_viewed_at: "2026-03-01T00:10:00.000Z",
    completed_at: "2026-03-01T00:15:00.000Z",
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:15:00.000Z"
  },
  {
    id: "progress-2",
    user_id: "user-1",
    lesson_id: "lesson-2",
    state: "in_progress",
    started_at: "2026-03-01T00:16:00.000Z",
    last_viewed_at: "2026-03-01T00:20:00.000Z",
    completed_at: null,
    created_at: "2026-03-01T00:16:00.000Z",
    updated_at: "2026-03-01T00:20:00.000Z"
  }
];

describe("course-rules", () => {
  it("detects active subscription states", () => {
    expect(hasActiveSubscription("active")).toBe(true);
    expect(hasActiveSubscription("trialing")).toBe(true);
    expect(hasActiveSubscription("inactive")).toBe(false);
  });

  it("calculates course progress percentages", () => {
    expect(calculateProgress(0, 0)).toBe(0);
    expect(calculateProgress(4, 1)).toBe(25);
    expect(calculateProgress(3, 2)).toBe(67);
  });

  it("builds course summaries and resumes at the next incomplete accessible lesson", () => {
    const [summary] = buildCourseSummaries({
      courses: [course],
      modules,
      lessons,
      progressRows,
      hasProAccess: false
    });

    expect(summary.progressPercentage).toBe(33);
    expect(summary.completedLessons).toBe(1);
    expect(summary.totalLessons).toBe(3);
    expect(summary.resumeHref).toBe(buildLessonHref(course.id, "module-1", "lesson-2"));
  });

  it("locks pro modules for free users and unlocks them for paid users", () => {
    const freeModules = buildCourseModuleSummaries({
      modules: [
        { module: modules[0], lessons: lessons.filter((lesson) => lesson.module_id === "module-1") },
        { module: modules[1], lessons: lessons.filter((lesson) => lesson.module_id === "module-2") }
      ],
      progressRows,
      hasProAccess: false
    });

    const paidModules = buildCourseModuleSummaries({
      modules: [
        { module: modules[0], lessons: lessons.filter((lesson) => lesson.module_id === "module-1") },
        { module: modules[1], lessons: lessons.filter((lesson) => lesson.module_id === "module-2") }
      ],
      progressRows,
      hasProAccess: true
    });

    expect(freeModules[0].locked).toBe(false);
    expect(freeModules[1].locked).toBe(true);
    expect(paidModules[1].locked).toBe(false);
  });

  it("finds the next accessible lesson href", () => {
    const moduleSummaries = buildCourseModuleSummaries({
      modules: [
        { module: modules[0], lessons: lessons.filter((lesson) => lesson.module_id === "module-1") },
        { module: modules[1], lessons: lessons.filter((lesson) => lesson.module_id === "module-2") }
      ],
      progressRows,
      hasProAccess: false
    });

    expect(
      findNextLessonHref({
        courseId: course.id,
        modules: moduleSummaries,
        currentLessonId: "lesson-1"
      })
    ).toBe(buildLessonHref(course.id, "module-1", "lesson-2"));

    expect(
      findNextLessonHref({
        courseId: course.id,
        modules: moduleSummaries,
        currentLessonId: "lesson-2"
      })
    ).toBeNull();
  });
});
