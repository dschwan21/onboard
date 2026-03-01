// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.fn();
const getPublishedCourseSummariesMock = vi.fn();

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
  getPublishedCourseSummaries: getPublishedCourseSummariesMock
}));

describe("/course page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue({ supabase: {}, user: { id: "user-1" } });
  });

  it("renders the empty state when there are no published courses", async () => {
    getPublishedCourseSummariesMock.mockResolvedValue([]);
    const Page = (await import("./page")).default;

    render(await Page());

    expect(screen.getByText("No published courses yet. Ask an admin to publish the first course.")).toBeInTheDocument();
  });

  it("renders published course summaries with resume actions", async () => {
    getPublishedCourseSummariesMock.mockResolvedValue([
      {
        course: {
          id: "course-1",
          title: "AI Foundations",
          slug: "ai-foundations",
          description: "Learn AI basics",
          is_published: true,
          created_at: "2026-03-01T00:00:00.000Z"
        },
        progressPercentage: 50,
        totalLessons: 4,
        completedLessons: 2,
        resumeHref: "/course/course-1/module-1/lesson-3"
      }
    ]);
    const Page = (await import("./page")).default;

    render(await Page());

    expect(screen.getByText("AI Foundations")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resume" })).toHaveAttribute(
      "href",
      "/course/course-1/module-1/lesson-3"
    );
  });
});
