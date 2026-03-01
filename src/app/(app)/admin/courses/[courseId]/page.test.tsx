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
  createModuleAction: vi.fn(),
  updateCourseAction: vi.fn(),
  updateModuleAction: vi.fn()
}));

describe("/admin/courses/[courseId] page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ supabase: {} });
  });

  it("renders course settings, module management, and lesson links", async () => {
    getAdminCourseDataMock.mockResolvedValue({
      course: {
        id: "course-1",
        title: "AI Foundations",
        description: "Core course",
        is_published: true
      },
      modules: [
        {
          module: {
            id: "module-1",
            course_id: "course-1",
            title: "Step 1",
            position: 1,
            is_pro: true
          },
          lessons: [
            {
              id: "lesson-1",
              title: "Lesson 1",
              position: 1,
              is_published: false
            }
          ]
        }
      ]
    });

    const Page = (await import("./page")).default;
    render(await Page({ params: Promise.resolve({ courseId: "course-1" }) }));

    expect(screen.getByText("Manage AI Foundations")).toBeInTheDocument();
    expect(screen.getByText("Course settings")).toBeInTheDocument();
    expect(screen.getByDisplayValue("AI Foundations")).toBeInTheDocument();
    expect(screen.getByText("Create module")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Order 1 · Draft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit lesson" })).toHaveAttribute(
      "href",
      "/admin/lessons/lesson-1"
    );
    expect(screen.getByRole("button", { name: "Create lesson" })).toBeInTheDocument();
  });

  it("renders the empty module state when a course has no modules", async () => {
    getAdminCourseDataMock.mockResolvedValue({
      course: {
        id: "course-1",
        title: "AI Foundations",
        description: null,
        is_published: false
      },
      modules: []
    });

    const Page = (await import("./page")).default;
    render(await Page({ params: Promise.resolve({ courseId: "course-1" }) }));

    expect(screen.getByText("No modules yet.")).toBeInTheDocument();
  });
});
