import Link from "next/link";

import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonSectionRow = Database["public"]["Tables"]["lesson_sections"]["Row"];

function linkClasses(isActive: boolean, level: "lesson" | "section") {
  const base = "block rounded-xl transition-colors hover:bg-white";

  if (level === "lesson") {
    return `${base} px-3 py-3 ${isActive ? "bg-white text-foreground shadow-sm ring-1 ring-slate-200" : "text-foreground/80"}`;
  }

  return `${base} ml-4 border-l border-slate-200 pl-4 pr-3 py-2 ${isActive ? "bg-white text-foreground shadow-sm ring-1 ring-slate-200" : "text-muted-foreground"}`;
}

export function CourseHierarchySidebar({
  course,
  lessons,
  sectionsByLessonId,
  currentLessonId
}: {
  course: CourseRow;
  lessons: LessonRow[];
  sectionsByLessonId: Map<string, LessonSectionRow[]>;
  currentLessonId?: string | null;
}) {
  const totalSections = lessons.reduce(
    (sum, lesson) => sum + (sectionsByLessonId.get(lesson.id)?.length ?? 0),
    0
  );

  return (
    <aside className="sticky top-8 h-[calc(100vh-8rem)] overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Course map</p>
        <h2 className="mt-3 text-xl font-semibold leading-tight text-slate-900">{course.title}</h2>
        <p className="mt-2 text-sm text-slate-500">
          {lessons.length} lessons · {totalSections} sections
        </p>
      </div>
      <div className="h-[calc(100%-7.5rem)] overflow-y-auto px-3 py-4">
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const sections = sectionsByLessonId.get(lesson.id) ?? [];
            const isActiveLesson = currentLessonId === lesson.id;
            const lessonHref = `/admin/lessons/${lesson.id}`;

            return (
              <div key={lesson.id} className="space-y-2">
                <Link className={linkClasses(isActiveLesson, "lesson")} href={lessonHref}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium">{lesson.title}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {sections.length}
                    </span>
                  </div>
                </Link>

                {isActiveLesson && sections.length > 0 ? (
                  <div className="space-y-1">
                    {sections.map((section) => (
                      <Link
                        key={section.id}
                        className={linkClasses(false, "section")}
                        href={`${lessonHref}#section-${section.id}`}
                      >
                        {section.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
