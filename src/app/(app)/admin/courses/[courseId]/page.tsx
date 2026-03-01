import Link from "next/link";

import {
  createLessonAction,
  createModuleAction,
  updateCourseAction,
  updateModuleAction
} from "@/app/(app)/admin/actions";
import { PageShell } from "@/components/layout/page-shell";
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
    <PageShell
      title={`Manage ${data.course.title}`}
      description="Edit course metadata, organize modules, and create lessons."
    >
      <div className="space-y-6">
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
          <h2 className="text-xl font-semibold">Create module</h2>
          <form action={createModuleAction} className="grid gap-4 md:grid-cols-[2fr_120px_auto]">
            <input name="courseId" type="hidden" value={courseId} />
            <Input name="title" placeholder="Module title" required />
            <Input min={1} name="position" placeholder="Order (auto)" type="number" />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input name="isPro" type="checkbox" />
                Pro
              </label>
              <Button type="submit">Add module</Button>
            </div>
          </form>
        </Card>

        {data.modules.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">No modules yet.</p>
          </Card>
        ) : (
          data.modules.map((entry) => (
            <Card key={entry.module.id} className="space-y-4 p-6">
              <form action={updateModuleAction} className="grid gap-4 md:grid-cols-[2fr_120px_auto_auto]">
                <input name="courseId" type="hidden" value={courseId} />
                <input name="moduleId" type="hidden" value={entry.module.id} />
                <Input defaultValue={entry.module.title} name="title" required />
                <Input defaultValue={entry.module.position} min={1} name="position" type="number" />
                <label className="flex items-center gap-2 text-sm">
                  <input defaultChecked={entry.module.is_pro} name="isPro" type="checkbox" />
                  Pro
                </label>
                <Button type="submit">Save module</Button>
              </form>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Lessons</p>
                {entry.lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lessons yet.</p>
                ) : (
                  entry.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Order {lesson.position} · {lesson.is_published ? "Published" : "Draft"}
                        </p>
                      </div>
                      <Button asChild variant="ghost">
                        <Link href={`/admin/lessons/${lesson.id}`}>Edit lesson</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <form action={createLessonAction} className="grid gap-4 md:grid-cols-[2fr_120px_auto]">
                <input name="courseId" type="hidden" value={courseId} />
                <input name="moduleId" type="hidden" value={entry.module.id} />
                <Input name="title" placeholder="New lesson title" required />
                <Input min={1} name="position" placeholder="Order (auto)" type="number" />
                <Button type="submit">Create lesson</Button>
              </form>
            </Card>
          ))
        )}
      </div>
    </PageShell>
  );
}
