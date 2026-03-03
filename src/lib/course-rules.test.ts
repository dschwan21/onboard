import {
  buildCourseLessonSummaries,
  buildCourseSummaries,
  buildLessonHref,
  calculateProgress,
  findNextLessonHref,
  hasActiveSubscription
} from "@/lib/course-rules";
import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonSectionRow = Database["public"]["Tables"]["lesson_sections"]["Row"];
type LessonProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];

const course: CourseRow = {
  id: "course-1",
  title: "AI Foundations",
  slug: "ai-foundations",
  description: "Learn the basics",
  is_published: true,
  created_at: "2026-03-01T00:00:00.000Z"
};

const lessons: LessonRow[] = [
  {
    id: "lesson-1",
    module_id: null,
    course_id: "course-1",
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
    module_id: null,
    course_id: "course-1",
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
    module_id: null,
    course_id: "course-1",
    title: "Lesson 3",
    content_markdown: "Advanced",
    task_prompt: null,
    video_url: null,
    is_published: true,
    position: 3,
    created_at: "2026-03-01T00:00:00.000Z"
  }
];

const sections: LessonSectionRow[] = [
  {
    id: "section-1",
    lesson_id: "lesson-1",
    title: "Introduction",
    position: 1,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "section-2",
    lesson_id: "lesson-2",
    title: "Practice",
    position: 1,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "section-3",
    lesson_id: "lesson-2",
    title: "Review",
    position: 2,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z"
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

  it("builds course summaries and resumes at the next incomplete lesson", () => {
    const [summary] = buildCourseSummaries({
      courses: [course],
      lessons,
      progressRows
    });

    expect(summary.progressPercentage).toBe(33);
    expect(summary.completedLessons).toBe(1);
    expect(summary.totalLessons).toBe(3);
    expect(summary.resumeHref).toBe(buildLessonHref(course.id, "lesson-2"));
  });

  it("builds lesson summaries with section counts and progress state", () => {
    const lessonSummaries = buildCourseLessonSummaries({
      lessons,
      sections,
      progressRows
    });

    expect(lessonSummaries).toHaveLength(3);
    expect(lessonSummaries[0].sectionCount).toBe(1);
    expect(lessonSummaries[0].completionState).toBe("completed");
    expect(lessonSummaries[1].sectionCount).toBe(2);
    expect(lessonSummaries[1].completionState).toBe("in_progress");
    expect(lessonSummaries[2].sectionCount).toBe(0);
    expect(lessonSummaries[2].completionState).toBe("not_started");
  });

  it("finds the next lesson href", () => {
    expect(
      findNextLessonHref({
        courseId: course.id,
        lessons,
        currentLessonId: "lesson-1"
      })
    ).toBe(buildLessonHref(course.id, "lesson-2"));

    expect(
      findNextLessonHref({
        courseId: course.id,
        lessons,
        currentLessonId: "lesson-3"
      })
    ).toBeNull();
  });
});
