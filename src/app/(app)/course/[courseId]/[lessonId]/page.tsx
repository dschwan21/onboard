import Link from "next/link";

import { markLessonCompleteAction, submitLessonAction } from "@/app/(app)/course/actions";
import { LessonBlocksRenderer } from "@/components/course/lesson-blocks-renderer";
import { LessonSidebar } from "@/components/course/lesson-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth/server";
import { ensureLessonStarted, getLessonPageData } from "@/lib/courses";

export default async function LessonPage({
  params,
  searchParams
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { courseId, lessonId } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireUser();
  const data = await getLessonPageData(supabase, user.id, courseId, lessonId);

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
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <LessonSidebar
        courseId={courseId}
        currentLessonId={lessonId}
        lessons={data.lessons}
        sections={data.sections}
        progressByLessonId={data.progressByLessonId}
      />
      <div className="space-y-6">
        <Card className="space-y-6 p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{data.course.title}</p>
            <h1 className="font-[var(--font-display)] text-4xl">{data.lesson.title}</h1>
          </div>

          {data.sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">This lesson has no sections yet.</p>
          ) : (
            <div className="space-y-10">
              {data.sections.map((section) => (
                <section id={`section-${section.id}`} key={section.id} className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      Section {section.position}
                    </p>
                    <h2 className="mt-2 font-[var(--font-display)] text-3xl">{section.title}</h2>
                  </div>
                  <LessonBlocksRenderer blocks={data.blocksBySectionId.get(section.id) ?? []} />
                </section>
              ))}
            </div>
          )}

          {data.lesson.task_prompt ? (
            <Card className="bg-secondary/60 p-5">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Task / Deliverable</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{data.lesson.task_prompt}</p>
            </Card>
          ) : null}
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-xl font-semibold">Submit your work</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Completing the lesson updates your progress across the course.
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
