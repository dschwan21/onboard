// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const getAdminCoursesMock = vi.fn();

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
  getAdminCourses: getAdminCoursesMock
}));

vi.mock("@/app/(app)/admin/actions", () => ({
  createCourseAction: vi.fn()
}));

describe("/admin/courses page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ supabase: {} });
  });

  it("renders the create form and empty state", async () => {
    getAdminCoursesMock.mockResolvedValue([]);
    const Page = (await import("./page")).default;

    render(await Page());

    expect(screen.getByText("Create new course")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Course title")).toBeInTheDocument();
    expect(screen.getByText("No courses created yet.")).toBeInTheDocument();
  });

  it("renders existing courses for admin management", async () => {
    getAdminCoursesMock.mockResolvedValue([
      {
        course: {
          id: "course-1",
          title: "AI Foundations",
          slug: "ai-foundations",
          description: null,
          is_published: false,
          created_at: "2026-03-01T00:00:00.000Z"
        },
        progressPercentage: 0,
        totalLessons: 0,
        completedLessons: 0,
        resumeHref: null,
        moduleCount: 2
      }
    ]);
    const Page = (await import("./page")).default;

    render(await Page());

    expect(screen.getByText("AI Foundations")).toBeInTheDocument();
    expect(screen.getByText("Draft · 2 modules")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage" })).toHaveAttribute(
      "href",
      "/admin/courses/course-1"
    );
  });
});
