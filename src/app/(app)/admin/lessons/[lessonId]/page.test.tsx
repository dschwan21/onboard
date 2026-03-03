// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const getAdminLessonWorkspaceDataMock = vi.fn();

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
  getAdminLessonWorkspaceData: getAdminLessonWorkspaceDataMock
}));

vi.mock("@/app/(app)/admin/actions", () => ({
  createLessonBlockAction: vi.fn(),
  createLessonSectionAction: vi.fn(),
  duplicateLessonBlockAction: vi.fn(),
  deleteLessonBlockAction: vi.fn(),
  reorderLessonBlocksAction: vi.fn(),
  reorderLessonSectionsAction: vi.fn(),
  updateLessonAction: vi.fn(),
  updateLessonBlockAction: vi.fn(),
  updateLessonSectionAction: vi.fn()
}));

describe("/admin/lessons/[lessonId] page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ supabase: {} });
  });

  it("renders the lesson metadata form, sections, and block editor", async () => {
    getAdminLessonWorkspaceDataMock.mockResolvedValue({
      course: { id: "course-1", title: "AI Foundations", is_published: true },
      lesson: {
        id: "lesson-1",
        course_id: "course-1",
        module_id: null,
        title: "Lesson 1",
        task_prompt: "Deliver something",
        content_markdown: "# Legacy fallback",
        video_url: null,
        is_published: true
      },
      lessons: [
        {
          id: "lesson-1",
          course_id: "course-1",
          module_id: null,
          title: "Lesson 1",
          content_markdown: "# Legacy fallback",
          task_prompt: "Deliver something",
          video_url: null,
          is_published: true,
          position: 1,
          created_at: "2026-03-01T00:00:00.000Z"
        }
      ],
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
      blocksBySectionId: new Map([
        [
          "section-1",
          [
            {
              id: "block-1",
              lesson_id: "lesson-1",
              lesson_section_id: "section-1",
              type: "heading",
              content: "Welcome",
              url: null,
              caption: null,
              position: 1,
              created_at: "2026-03-01T00:00:00.000Z",
              updated_at: "2026-03-01T00:00:00.000Z"
            }
          ]
        ]
      ])
    });

    const Page = (await import("./page")).default;
    render(await Page({ params: Promise.resolve({ lessonId: "lesson-1" }) }));

    expect(screen.getByText("Sections")).toBeInTheDocument();
    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Lesson 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Deliver something")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Introduction")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Welcome")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
