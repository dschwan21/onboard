import Link from "next/link";

import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonSectionRow = Database["public"]["Tables"]["lesson_sections"]["Row"];
type LessonProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];

export function LessonSidebar({
  courseId,
  currentLessonId,
  currentSectionId,
  lessons,
  sections,
  progressByLessonId
}: {
  courseId: string;
  currentLessonId: string;
  currentSectionId?: string | null;
  lessons: LessonRow[];
  sections: LessonSectionRow[];
  progressByLessonId: Map<string, LessonProgressRow>;
}) {
  return (
    <aside className="rounded-2xl border border-border bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lesson navigation</p>
      <div className="mt-4 space-y-2">
        {lessons.map((lesson) => {
          const progress = progressByLessonId.get(lesson.id);
          const isCurrent = lesson.id === currentLessonId;

          return (
            <div key={lesson.id} className="space-y-1">
              <Link
                href={`/course/${courseId}/${lesson.id}`}
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
                  {progress?.state === "completed"
                    ? "Done"
                    : progress?.state === "in_progress"
                      ? "In progress"
                      : ""}
                </span>
              </Link>
              {isCurrent && sections.length > 0 ? (
                <div className="space-y-1 pl-4">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#section-${section.id}`}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary",
                        currentSectionId === section.id ? "bg-secondary font-medium text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {section.title}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
