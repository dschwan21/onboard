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

        {overview.lessons.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              This course does not have any published lessons yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {overview.lessons.map((entry) => (
              <Card key={entry.lesson.id} className="space-y-4 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{entry.lesson.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.sectionCount} sections · {entry.completionState.replace("_", " ")}
                    </p>
                  </div>
                  <Button asChild variant="ghost">
                    <Link href={`/course/${overview.course.id}/${entry.lesson.id}`}>Open lesson</Link>
                  </Button>
                </div>

                {entry.sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sections in this lesson yet.</p>
                ) : (
                  <div className="space-y-2">
                    {entry.sections.map((section) => (
                      <div
                        key={section.id}
                        className="rounded-xl border border-border px-4 py-3"
                      >
                        <p className="font-medium">{section.title}</p>
                        <p className="text-sm text-muted-foreground">Section {section.position}</p>
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
