import Link from "next/link";

import { CourseHierarchySidebar } from "@/components/admin/course-hierarchy-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonSectionRow = Database["public"]["Tables"]["lesson_sections"]["Row"];

export function AdminBuilderShell({
  course,
  lessons,
  sectionsByLessonId,
  title,
  description,
  currentLessonId,
  contentChrome = "card",
  contentClassName,
  children
}: {
  course: CourseRow;
  lessons: LessonRow[];
  sectionsByLessonId: Map<string, LessonSectionRow[]>;
  title: string;
  description: string;
  currentLessonId?: string | null;
  contentChrome?: "card" | "plain";
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.55),_rgba(255,255,255,0.96)_40%,_rgba(245,245,244,0.9)_100%)] shadow-[0_30px_90px_rgba(15,23,42,0.1)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Course builder</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/admin/courses">All courses</Link>
            </Button>
            <Button asChild>
              <Link href={`/course/${course.id}`}>Preview course</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <CourseHierarchySidebar
            course={course}
            lessons={lessons}
            sectionsByLessonId={sectionsByLessonId}
            currentLessonId={currentLessonId}
          />
          {contentChrome === "card" ? (
            <div className="space-y-6">
              <Card className="rounded-[2rem] border-slate-200/80 bg-white/90 p-0 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="border-b border-slate-200/70 px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    <span>{course.is_published ? "Published" : "Draft"}</span>
                    <span>•</span>
                    <span>{lessons.length} lessons</span>
                  </div>
                </div>
                <div className={cn("p-6", contentClassName)}>{children}</div>
              </Card>
            </div>
          ) : (
            <div className={cn("min-w-0", contentClassName)}>{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
