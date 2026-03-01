import React from "react";
import Link from "next/link";

import { ProgressBar } from "@/components/course/progress-bar";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/server";
import { getCourseOverview } from "@/lib/courses";

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { supabase, user } = await requireUser();
  const overview = await getCourseOverview(supabase, user.id, courseId);

  return (
    <PageShell
      title={overview.course.title}
      description={overview.course.description ?? "Course overview"}
    >
      <div className="space-y-6">
        <Card className="space-y-3 p-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Overall progress</span>
            <span>
              {overview.completedLessons} / {overview.totalLessons} lessons
            </span>
          </div>
          <ProgressBar value={overview.progressPercentage} />
          <p className="text-sm text-muted-foreground">
            {overview.progressPercentage}% complete
          </p>
        </Card>

        {overview.modules.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              This course does not have any published modules yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {overview.modules.map((entry) => (
              <Card key={entry.module.id} className="space-y-4 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{entry.module.title}</h2>
                      {entry.locked ? (
                        <span className="rounded-full bg-accent/15 px-2 py-1 text-xs uppercase tracking-[0.15em] text-accent">
                          Pro only
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.lessonCount} lessons · {entry.completionCount} completed
                    </p>
                  </div>
                </div>

                {entry.lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No published lessons in this module.</p>
                ) : (
                  <div className="space-y-2">
                    {entry.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">{lesson.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Lesson {lesson.position}
                          </p>
                        </div>
                        {entry.locked ? (
                          <span className="text-sm text-muted-foreground">Locked</span>
                        ) : (
                          <Button asChild variant="ghost">
                            <Link href={`/course/${overview.course.id}/${entry.module.id}/${lesson.id}`}>
                              Open lesson
                            </Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
