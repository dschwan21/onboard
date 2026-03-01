import Link from "next/link";
import { redirect } from "next/navigation";

import { markLessonCompleteAction, submitLessonAction } from "@/app/(app)/course/actions";
import { LessonSidebar } from "@/components/course/lesson-sidebar";
import { MarkdownContent } from "@/components/course/markdown-content";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth/server";
import { ensureLessonStarted, getLessonPageData } from "@/lib/courses";

export default async function LessonPage({
  params,
  searchParams
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { courseId, moduleId, lessonId } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const data = await getLessonPageData(supabase, user.id, courseId, moduleId, lessonId);

  if (data.module.is_pro && !data.hasProAccess) {
    redirect(`/course/${courseId}?locked=1`);
  }

  await ensureLessonStarted(supabase, user.id, lessonId);
  if (!data.progressByLessonId.has(lessonId)) {
    data.progressByLessonId.set(lessonId, {
      id: "",
      user_id: user.id,
      lesson_id: lessonId,
      state: "in_progress",
      started_at: new Date().toISOString(),
      last_viewed_at: new Date().toISOString(),
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  const completed = query.completed === "1" || data.progressByLessonId.get(lessonId)?.state === "completed";
  const nextLessonHref = typeof query.next === "string" ? query.next : data.nextLessonHref;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <LessonSidebar
        courseId={courseId}
        moduleId={moduleId}
        currentLessonId={lessonId}
        lessons={data.lessonsInModule}
        progressByLessonId={data.progressByLessonId}
      />
      <div className="space-y-6">
        <Card className="space-y-6 p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {data.course.title} / {data.module.title}
            </p>
            <h1 className="font-[var(--font-display)] text-4xl">{data.lesson.title}</h1>
          </div>

          {data.lesson.video_url ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full"
                src={data.lesson.video_url}
                title={data.lesson.title}
              />
            </div>
          ) : null}

          <MarkdownContent content={data.lesson.content_markdown ?? "Lesson content coming soon."} />

          {data.lesson.task_prompt ? (
            <Card className="bg-secondary/60 p-5">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Task / Deliverable
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{data.lesson.task_prompt}</p>
            </Card>
          ) : null}
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-xl font-semibold">Submit your work</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Submitting work marks the lesson complete and updates progress across the course.
            </p>
          </div>

          {completed ? (
            <div className="space-y-4 rounded-xl bg-secondary p-4">
              <p className="text-sm font-medium">Lesson completed.</p>
              {nextLessonHref ? (
                <Button asChild>
                  <Link href={nextLessonHref}>Next lesson</Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You have finished the last published lesson in this course.
                </p>
              )}
            </div>
          ) : null}

          <form action={submitLessonAction} className="space-y-4">
            <input name="courseId" type="hidden" value={courseId} />
            <input name="moduleId" type="hidden" value={moduleId} />
            <input name="lessonId" type="hidden" value={lessonId} />
            <input name="nextLessonHref" type="hidden" value={data.nextLessonHref ?? ""} />
            <Textarea
              defaultValue={data.submission?.submission_text ?? ""}
              name="submissionText"
              placeholder="Write your response, notes, or deliverable here."
            />
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Submit work</Button>
            </div>
          </form>

          <form action={markLessonCompleteAction}>
            <input name="courseId" type="hidden" value={courseId} />
            <input name="moduleId" type="hidden" value={moduleId} />
            <input name="lessonId" type="hidden" value={lessonId} />
            <input name="nextLessonHref" type="hidden" value={data.nextLessonHref ?? ""} />
            <Button type="submit" variant="outline">
              Mark complete without submission
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
