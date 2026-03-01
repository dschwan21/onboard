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

  it("renders module progress, completion counts, and pro locks", async () => {
    getCourseOverviewMock.mockResolvedValue({
      course: {
        id: "course-1",
        title: "AI Foundations",
        slug: "ai-foundations",
        description: "Course overview",
        is_published: true,
        created_at: "2026-03-01T00:00:00.000Z"
      },
      modules: [
        {
          module: {
            id: "module-1",
            course_id: "course-1",
            title: "Step 1",
            position: 1,
            is_pro: false,
            created_at: "2026-03-01T00:00:00.000Z"
          },
          lessons: [
            {
              id: "lesson-1",
              module_id: "module-1",
              title: "Lesson 1",
              content_markdown: "",
              task_prompt: null,
              video_url: null,
              is_published: true,
              position: 1,
              created_at: "2026-03-01T00:00:00.000Z"
            }
          ],
          lessonCount: 1,
          completionCount: 1,
          locked: false
        },
        {
          module: {
            id: "module-2",
            course_id: "course-1",
            title: "Step 2",
            position: 2,
            is_pro: true,
            created_at: "2026-03-01T00:00:00.000Z"
          },
          lessons: [
            {
              id: "lesson-2",
              module_id: "module-2",
              title: "Lesson 2",
              content_markdown: "",
              task_prompt: null,
              video_url: null,
              is_published: true,
              position: 1,
              created_at: "2026-03-01T00:00:00.000Z"
            }
          ],
          lessonCount: 1,
          completionCount: 0,
          locked: true
        }
      ],
      progressPercentage: 50,
      totalLessons: 2,
      completedLessons: 1,
      hasProAccess: false
    });

    const Page = (await import("./page")).default;
    render(await Page({ params: Promise.resolve({ courseId: "course-1" }) }));

    expect(screen.getByText("AI Foundations")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 lessons")).toBeInTheDocument();
    expect(screen.getByText("Pro only")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open lesson" })).toHaveAttribute(
      "href",
      "/course/course-1/module-1/lesson-1"
    );
  });
});
