// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const getAdminCourseDataMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/lib/auth/server", () => ({
  requireAdmin: requireAdminMock
}));

vi.mock("@/lib/courses", () => ({
  getAdminCourseData: getAdminCourseDataMock
}));

vi.mock("@/app/(app)/admin/actions", () => ({
  createLessonAction: vi.fn(),
  reorderLessonsAction: vi.fn(),
  updateCourseAction: vi.fn()
}));

describe("/admin/courses/[courseId] page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ supabase: {} });
  });

  it("renders course settings, lesson management, and lesson links", async () => {
    getAdminCourseDataMock.mockResolvedValue({
      course: {
        id: "course-1",
        title: "AI Foundations",
        description: "Core course",
        is_published: true
      },
      lessons: [
        {
          id: "lesson-1",
          course_id: "course-1",
          module_id: null,
          title: "Lesson 1",
          content_markdown: null,
          task_prompt: null,
          video_url: null,
          is_published: false,
          position: 1,
          created_at: "2026-03-01T00:00:00.000Z"
        }
      ],
      sectionsByLessonId: new Map([
        [
          "lesson-1",
          [
            {
              id: "section-1",
              lesson_id: "lesson-1",
              title: "Introduction",
              position: 1,
              created_at: "2026-03-01T00:00:00.000Z",
              updated_at: "2026-03-01T00:00:00.000Z"
            }
          ]
        ]
      ]),
      blocksBySectionId: new Map()
    });

    const Page = (await import("./page")).default;
    render(await Page({ params: Promise.resolve({ courseId: "course-1" }) }));

    expect(screen.getByText("Build AI Foundations")).toBeInTheDocument();
    expect(screen.getByText("Course settings")).toBeInTheDocument();
    expect(screen.getByDisplayValue("AI Foundations")).toBeInTheDocument();
    expect(screen.getByText("Lesson order")).toBeInTheDocument();
    expect(screen.getByText("1 sections · Draft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit lesson" })).toHaveAttribute(
      "href",
      "/admin/lessons/lesson-1"
    );
    expect(screen.getByRole("button", { name: "Create lesson" })).toBeInTheDocument();
  });

  it("renders the empty lesson state when a course has no lessons", async () => {
    getAdminCourseDataMock.mockResolvedValue({
      course: {
        id: "course-1",
        title: "AI Foundations",
        description: null,
        is_published: false
      },
      lessons: [],
      sectionsByLessonId: new Map(),
      blocksBySectionId: new Map()
    });

    const Page = (await import("./page")).default;
    render(await Page({ params: Promise.resolve({ courseId: "course-1" }) }));

    expect(screen.getByText("No lessons yet.")).toBeInTheDocument();
  });
});
