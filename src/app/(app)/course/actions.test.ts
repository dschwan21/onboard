import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const revalidatePathMock = vi.fn();
const requireUserMock = vi.fn();
const completeLessonMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/auth/server", () => ({
  requireUser: requireUserMock
}));

vi.mock("@/lib/courses", async () => {
  const actual = await vi.importActual<typeof import("@/lib/courses")>("@/lib/courses");
  return {
    ...actual,
    completeLesson: completeLessonMock
  };
});

describe("course actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue({ supabase: {}, user: { id: "user-1" } });
  });

  it("submits lesson work, revalidates progress pages, and redirects with next lesson state", async () => {
    completeLessonMock.mockResolvedValue(undefined);
    const { submitLessonAction } = await import("./actions");
    const formData = new FormData();
    formData.set("courseId", "course-1");
    formData.set("lessonId", "lesson-1");
    formData.set("submissionText", "My submission");
    formData.set("nextLessonHref", "/course/course-1/lesson-2");

    await expect(submitLessonAction(formData)).rejects.toThrow(
      "REDIRECT:/course/course-1/lesson-1?completed=1&next=%2Fcourse%2Fcourse-1%2Flesson-2"
    );

    expect(completeLessonMock).toHaveBeenCalledWith({}, "user-1", "lesson-1", "My submission");
    expect(revalidatePathMock).toHaveBeenCalledWith("/course");
    expect(revalidatePathMock).toHaveBeenCalledWith("/course/course-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/course/course-1/lesson-1");
  });

  it("marks a lesson complete without a submission and redirects back to the lesson", async () => {
    completeLessonMock.mockResolvedValue(undefined);
    const { markLessonCompleteAction } = await import("./actions");
    const formData = new FormData();
    formData.set("courseId", "course-1");
    formData.set("lessonId", "lesson-1");

    await expect(markLessonCompleteAction(formData)).rejects.toThrow(
      "REDIRECT:/course/course-1/lesson-1?completed=1"
    );

    expect(completeLessonMock).toHaveBeenCalledWith({}, "user-1", "lesson-1");
    expect(revalidatePathMock).toHaveBeenCalledTimes(3);
  });
});
