import {
  createLessonAction,
  reorderLessonsAction,
  updateCourseAction
} from "@/app/(app)/admin/actions";
import { AdminBuilderShell } from "@/components/admin/admin-builder-shell";
import { SortableOrderForm } from "@/components/admin/sortable-order-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth/server";
import { getAdminCourseData } from "@/lib/courses";

export default async function AdminCourseDetailPage({
  params
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { supabase } = await requireAdmin();
  const data = await getAdminCourseData(supabase, courseId);

  return (
    <AdminBuilderShell
      course={data.course}
      lessons={data.lessons}
      sectionsByLessonId={data.sectionsByLessonId}
      title={`Build ${data.course.title}`}
      description="Shape the course, order lessons, and open a lesson to manage its sections and content."
    >
      <div className="space-y-8">
        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold">Course settings</h2>
          <form action={updateCourseAction} className="grid gap-4">
            <input name="courseId" type="hidden" value={courseId} />
            <Input defaultValue={data.course.title} name="title" required />
            <Textarea
              defaultValue={data.course.description ?? ""}
              name="description"
              placeholder="Course description"
            />
            <label className="flex items-center gap-2 text-sm">
              <input defaultChecked={data.course.is_published} name="isPublished" type="checkbox" />
              Published
            </label>
            <div>
              <Button type="submit">Save course</Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-xl font-semibold">Lesson order</h2>
            <p className="text-sm text-muted-foreground">
              Reorder the main learning path, then open a lesson to edit its sections and content.
            </p>
          </div>
          <SortableOrderForm
            action={reorderLessonsAction}
            emptyLabel="No lessons yet."
            hiddenFields={{ courseId }}
            items={data.lessons.map((lesson) => ({
              id: lesson.id,
              label: lesson.title,
              detail: `${data.sectionsByLessonId.get(lesson.id)?.length ?? 0} sections · ${
                lesson.is_published ? "Published" : "Draft"
              }`,
              href: `/admin/lessons/${lesson.id}`,
              actionLabel: "Edit lesson"
            }))}
          />
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold">Create lesson</h2>
          <form action={createLessonAction} className="grid gap-4 md:grid-cols-[2fr_auto]">
            <input name="courseId" type="hidden" value={courseId} />
            <Input name="title" placeholder="New lesson title" required />
            <Button type="submit">Create lesson</Button>
          </form>
        </Card>
      </div>
    </AdminBuilderShell>
  );
}
