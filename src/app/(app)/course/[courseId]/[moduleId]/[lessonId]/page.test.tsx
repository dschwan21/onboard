// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.fn();
const getLessonPageDataMock = vi.fn();
const ensureLessonStartedMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/lib/auth/server", () => ({
  requireUser: requireUserMock
}));

vi.mock("@/lib/courses", () => ({
  getLessonPageData: getLessonPageDataMock,
  ensureLessonStarted: ensureLessonStartedMock
}));

vi.mock("@/app/(app)/course/actions", () => ({
  submitLessonAction: vi.fn(),
  markLessonCompleteAction: vi.fn()
}));

vi.mock("@/components/course/markdown-content", () => ({
  MarkdownContent: ({ content }: { content: string }) => <div>{content}</div>
}));

vi.mock("@/components/course/lesson-sidebar", () => ({
  LessonSidebar: ({
    lessons,
    currentLessonId,
    progressByLessonId
  }: {
    lessons: Array<{ id: string; title: string }>;
    currentLessonId: string;
    progressByLessonId: Map<string, { state: string }>;
  }) => (
    <aside>
      {lessons.map((lesson) => (
        <div key={lesson.id}>
          <span>{lesson.title}</span>
          {lesson.id === currentLessonId ? <span>Current</span> : null}
          {progressByLessonId.get(lesson.id)?.state === "completed" ? <span>Completed</span> : null}
        </div>
      ))}
    </aside>
  )
}));

describe("/course/[courseId]/[moduleId]/[lessonId] page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue({ supabase: {}, user: { id: "user-1" } });
    ensureLessonStartedMock.mockResolvedValue(undefined);
  });

  it("renders lesson content, submission UI, sidebar state, and next lesson CTA", async () => {
    getLessonPageDataMock.mockResolvedValue({
      course: { id: "course-1", title: "AI Foundations" },
      module: { id: "module-1", title: "Module 1", is_pro: false },
      lesson: {
        id: "lesson-1",
        title: "Lesson 1",
        content_markdown: "# Intro",
        task_prompt: "Draft an AI workflow",
        video_url: "https://example.com/embed",
        is_published: true
      },
      lessonsInModule: [
        { id: "lesson-1", title: "Lesson 1" },
        { id: "lesson-2", title: "Lesson 2" }
      ],
      progressByLessonId: new Map([
        ["lesson-1", { state: "completed" }],
        ["lesson-2", { state: "in_progress" }]
      ]),
      submission: { submission_text: "Existing work" },
      nextLessonHref: "/course/course-1/module-1/lesson-2",
      hasProAccess: true
    });

    const Page = (await import("./page")).default;

    render(
      await Page({
        params: Promise.resolve({
          courseId: "course-1",
          moduleId: "module-1",
          lessonId: "lesson-1"
        }),
        searchParams: Promise.resolve({ completed: "1" })
      })
    );

    expect(ensureLessonStartedMock).toHaveBeenCalledWith({}, "user-1", "lesson-1");
    expect(screen.getByRole("heading", { level: 1, name: "Lesson 1" })).toBeInTheDocument();
    expect(screen.getByText("# Intro")).toBeInTheDocument();
    expect(screen.getByText("Task / Deliverable")).toBeInTheDocument();
    expect(screen.getByText("Draft an AI workflow")).toBeInTheDocument();
    expect(screen.getByTitle("Lesson 1")).toHaveAttribute("src", "https://example.com/embed");
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing work")).toBeInTheDocument();
    expect(screen.getByText("Lesson completed.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next lesson" })).toHaveAttribute(
      "href",
      "/course/course-1/module-1/lesson-2"
    );
  });

  it("redirects free-tier users away from locked pro lessons", async () => {
    getLessonPageDataMock.mockResolvedValue({
      course: { id: "course-1", title: "AI Foundations" },
      module: { id: "module-1", title: "Module 1", is_pro: true },
      lesson: {
        id: "lesson-1",
        title: "Lesson 1",
        content_markdown: "",
        task_prompt: null,
        video_url: null,
        is_published: true
      },
      lessonsInModule: [],
      progressByLessonId: new Map(),
      submission: null,
      nextLessonHref: null,
      hasProAccess: false
    });

    const Page = (await import("./page")).default;
    await expect(
      Page({
        params: Promise.resolve({
          courseId: "course-1",
          moduleId: "module-1",
          lessonId: "lesson-1"
        }),
        searchParams: Promise.resolve({})
      })
    ).rejects.toThrow("REDIRECT:/course/course-1?locked=1");
  });
});
