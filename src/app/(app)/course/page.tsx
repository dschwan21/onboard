import React from "react";

import { CourseCard } from "@/components/course/course-card";
import { PageShell } from "@/components/layout/page-shell";
import { getPublishedCourseSummaries } from "@/lib/courses";
import { requireUser } from "@/lib/auth/server";

export default async function CoursePage() {
  const { supabase, user } = await requireUser();
  const courses = await getPublishedCourseSummaries(supabase, user.id);

  return (
    <PageShell
      title="Course"
      description="Published learning paths with resume links and live progress tracking."
    >
      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published courses yet. Ask an admin to publish the first course.
        </p>
      ) : (
        <div className="grid gap-4">
          {courses.map((summary) => (
            <CourseCard key={summary.course.id} summary={summary} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
