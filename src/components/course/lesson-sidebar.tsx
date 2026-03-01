import Link from "next/link";

import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];

export function LessonSidebar({
  courseId,
  moduleId,
  currentLessonId,
  lessons,
  progressByLessonId
}: {
  courseId: string;
  moduleId: string;
  currentLessonId: string;
  lessons: LessonRow[];
  progressByLessonId: Map<string, LessonProgressRow>;
}) {
  return (
    <aside className="rounded-2xl border border-border bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Module lessons
      </p>
      <div className="mt-4 space-y-2">
        {lessons.map((lesson) => {
          const progress = progressByLessonId.get(lesson.id);
          const isCurrent = lesson.id === currentLessonId;

          return (
            <Link
              key={lesson.id}
              href={`/course/${courseId}/${moduleId}/${lesson.id}`}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                isCurrent ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              )}
            >
              <span>{lesson.title}</span>
              <span
                className={cn(
                  "text-xs uppercase tracking-[0.15em]",
                  isCurrent ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {progress?.state === "completed" ? "Done" : progress?.state === "in_progress" ? "In progress" : ""}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
