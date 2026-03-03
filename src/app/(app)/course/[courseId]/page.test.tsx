// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.fn();
const getCourseOverviewMock = vi.fn();

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
  getCourseOverview: getCourseOverviewMock
}));

describe("/course/[courseId] page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue({ supabase: {}, user: { id: "user-1" } });
  });

  it("renders lesson progress and section counts", async () => {
    getCourseOverviewMock.mockResolvedValue({
      course: {
        id: "course-1",
        title: "AI Foundations",
        slug: "ai-foundations",
        description: "Course overview",
        is_published: true,
        created_at: "2026-03-01T00:00:00.000Z"
      },
      lessons: [
        {
          lesson: {
            id: "lesson-1",
            course_id: "course-1",
            module_id: null,
            title: "Lesson 1",
            content_markdown: "",
            task_prompt: null,
            video_url: null,
            is_published: true,
            position: 1,
            created_at: "2026-03-01T00:00:00.000Z"
          },
          sections: [
            {
              id: "section-1",
              lesson_id: "lesson-1",
              title: "Introduction",
              position: 1,
              created_at: "2026-03-01T00:00:00.000Z",
              updated_at: "2026-03-01T00:00:00.000Z"
            }
          ],
          sectionCount: 1,
          completionState: "completed"
        },
        {
          lesson: {
            id: "lesson-2",
            course_id: "course-1",
            module_id: null,
            title: "Lesson 2",
            content_markdown: "",
            task_prompt: null,
            video_url: null,
            is_published: true,
            position: 2,
            created_at: "2026-03-01T00:00:00.000Z"
          },
          sections: [
            {
              id: "section-2",
              lesson_id: "lesson-2",
              title: "Practice",
              position: 1,
              created_at: "2026-03-01T00:00:00.000Z",
              updated_at: "2026-03-01T00:00:00.000Z"
            }
          ],
          sectionCount: 1,
          completionState: "in_progress"
        }
      ],
      progressPercentage: 50,
      totalLessons: 2,
      completedLessons: 1
    });

    const Page = (await import("./page")).default;
    render(await Page({ params: Promise.resolve({ courseId: "course-1" }) }));

    expect(screen.getByText("AI Foundations")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 lessons")).toBeInTheDocument();
    expect(screen.getByText("1 sections · completed")).toBeInTheDocument();
    expect(screen.getByText("1 sections · in progress")).toBeInTheDocument();
    expect(screen.getByText("Introduction")).toBeInTheDocument();
    const lessonLinks = screen.getAllByRole("link", { name: "Open lesson" });
    expect(lessonLinks[0]).toHaveAttribute("href", "/course/course-1/lesson-1");
  });
});
