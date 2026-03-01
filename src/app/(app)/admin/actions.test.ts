import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const revalidatePathMock = vi.fn();
const requireAdminMock = vi.fn();
const requireUserMock = vi.fn();
const insertAndSelectSingleMock = vi.fn();
const selectMaybeSingleMock = vi.fn();
const selectRowsMock = vi.fn();
const updateWhereEqMock = vi.fn();
const completeLessonMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/auth/server", () => ({
  requireAdmin: requireAdminMock,
  requireUser: requireUserMock
}));

vi.mock("@/lib/supabase/query-helpers", () => ({
  insertAndSelectSingle: insertAndSelectSingleMock,
  selectMaybeSingle: selectMaybeSingleMock,
  selectRows: selectRowsMock,
  updateWhereEq: updateWhereEqMock
}));

vi.mock("@/lib/courses", async () => {
  const actual = await vi.importActual<typeof import("@/lib/courses")>("@/lib/courses");
  return {
    ...actual,
    completeLesson: completeLessonMock
  };
});

describe("admin and course actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ supabase: {} });
    requireUserMock.mockResolvedValue({ supabase: {}, user: { id: "user-1" } });
  });

  it("creates a course and redirects to the admin detail page", async () => {
    insertAndSelectSingleMock.mockResolvedValue({
      data: { id: "course-1" },
      error: null
    });

    const { createCourseAction } = await import("./actions");
    const formData = new FormData();
    formData.set("title", "AI Foundations");
    formData.set("description", "Learn AI");

    await expect(createCourseAction(formData)).rejects.toThrow("REDIRECT:/admin/courses/course-1");
    expect(insertAndSelectSingleMock).toHaveBeenCalledWith(
      {},
      "courses",
      expect.objectContaining({
        title: "AI Foundations",
        slug: "ai-foundations"
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/courses");
  });

  it("auto-assigns the next module position when left blank", async () => {
    selectRowsMock.mockResolvedValueOnce({
      data: [{ position: 1 }, { position: 2 }],
      error: null
    });
    insertAndSelectSingleMock.mockResolvedValue({
      data: { id: "module-3" },
      error: null
    });

    const { createModuleAction } = await import("./actions");
    const formData = new FormData();
    formData.set("courseId", "course-1");
    formData.set("title", "Step 3");
    formData.set("position", "");

    await createModuleAction(formData);

    expect(insertAndSelectSingleMock).toHaveBeenCalledWith(
      {},
      "modules",
      expect.objectContaining({
        course_id: "course-1",
        title: "Step 3",
        position: 3
      })
    );
  });

  it("marks a lesson complete, revalidates paths, and redirects to the next lesson", async () => {
    completeLessonMock.mockResolvedValue(undefined);

    const { submitLessonAction } = await import("../course/actions");
    const formData = new FormData();
    formData.set("courseId", "course-1");
    formData.set("moduleId", "module-1");
    formData.set("lessonId", "lesson-1");
    formData.set("submissionText", "My submission");
    formData.set("nextLessonHref", "/course/course-1/module-1/lesson-2");

    await expect(submitLessonAction(formData)).rejects.toThrow(
      "REDIRECT:/course/course-1/module-1/lesson-1?completed=1&next=%2Fcourse%2Fcourse-1%2Fmodule-1%2Flesson-2"
    );

    expect(completeLessonMock).toHaveBeenCalledWith({}, "user-1", "lesson-1", "My submission");
    expect(revalidatePathMock).toHaveBeenCalledWith("/course");
    expect(revalidatePathMock).toHaveBeenCalledWith("/course/course-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/course/course-1/module-1/lesson-1");
  });
});
