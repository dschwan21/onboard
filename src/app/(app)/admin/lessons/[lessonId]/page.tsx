import Link from "next/link";
import { notFound } from "next/navigation";

import { updateLessonAction } from "@/app/(app)/admin/actions";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth/server";
import { selectMaybeSingle } from "@/lib/supabase/query-helpers";
import type { Database } from "@/types/database";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type ModuleRow = Database["public"]["Tables"]["modules"]["Row"];
type CourseRow = Database["public"]["Tables"]["courses"]["Row"];

export default async function AdminLessonPage({
  params
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const { supabase } = await requireAdmin();
  const { data: lesson } = await selectMaybeSingle<LessonRow>(supabase, "lessons", "*", {
    column: "id",
    value: lessonId
  });

  if (!lesson) {
    notFound();
  }

  const { data: module } = await selectMaybeSingle<ModuleRow>(supabase, "modules", "*", {
    column: "id",
    value: lesson.module_id
  });

  if (!module) {
    notFound();
  }

  const { data: course } = await selectMaybeSingle<CourseRow>(supabase, "courses", "*", {
    column: "id",
    value: module.course_id
  });

  if (!course) {
    notFound();
  }

  return (
    <PageShell
      title={`Edit ${lesson.title}`}
      description={`Lesson editor for ${course.title}`}
    >
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{course.title}</p>
            <p className="text-sm text-muted-foreground">{module.title}</p>
          </div>
          <Button asChild variant="ghost">
            <Link href={`/admin/courses/${course.id}`}>Back to course</Link>
          </Button>
        </div>
        <form action={updateLessonAction} className="grid gap-4">
          <input name="lessonId" type="hidden" value={lesson.id} />
          <Input defaultValue={lesson.title} name="title" required />
          <Input defaultValue={lesson.position} min={1} name="position" type="number" />
          <Input
            defaultValue={lesson.video_url ?? ""}
            name="videoUrl"
            placeholder="Embed URL (optional)"
          />
          <Textarea
            defaultValue={lesson.task_prompt ?? ""}
            name="taskPrompt"
            placeholder="Task or deliverable prompt"
          />
          <Textarea
            defaultValue={lesson.content_markdown ?? ""}
            name="contentMarkdown"
            placeholder="Lesson markdown content"
          />
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={lesson.is_published} name="isPublished" type="checkbox" />
            Published
          </label>
          <div>
            <Button type="submit">Save lesson</Button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
