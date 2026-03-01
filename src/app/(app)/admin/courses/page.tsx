import React from "react";
import Link from "next/link";

import { createCourseAction } from "@/app/(app)/admin/actions";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth/server";
import { getAdminCourses } from "@/lib/courses";

export default async function AdminCoursesPage() {
  const { supabase } = await requireAdmin();
  const courses = await getAdminCourses(supabase);

  return (
    <PageShell
      title="Admin Courses"
      description="Minimal course CMS for creating and organizing curriculum."
    >
      <div className="space-y-6">
        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold">Create new course</h2>
          <form action={createCourseAction} className="grid gap-4">
            <Input name="title" placeholder="Course title" required />
            <Textarea name="description" placeholder="Course description" />
            <div>
              <Button type="submit">Create course</Button>
            </div>
          </form>
        </Card>

        {courses.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">No courses created yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {courses.map((entry) => (
              <Card key={entry.course.id} className="flex items-center justify-between p-6">
                <div>
                  <h2 className="text-xl font-semibold">{entry.course.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.course.is_published ? "Published" : "Draft"} · {entry.moduleCount} modules
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/admin/courses/${entry.course.id}`}>Manage</Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
