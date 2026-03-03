import Link from "next/link";

import {
  createLessonSectionAction,
  reorderLessonSectionsAction,
  updateLessonAction
} from "@/app/(app)/admin/actions";
import { AdminBuilderShell } from "@/components/admin/admin-builder-shell";
import { LessonDocumentEditor } from "@/components/admin/lesson-document-editor";
import { SortableOrderForm } from "@/components/admin/sortable-order-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth/server";
import { getAdminLessonWorkspaceData } from "@/lib/courses";

export default async function AdminLessonPage({
  params
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const { supabase } = await requireAdmin();
  const data = await getAdminLessonWorkspaceData(supabase, lessonId);
  const { course, lesson, lessons, sections, sectionsByLessonId, blocksBySectionId } = data;

  return (
    <AdminBuilderShell
      course={course}
      lessons={lessons}
      sectionsByLessonId={sectionsByLessonId}
      currentLessonId={lesson.id}
      title={`Edit ${lesson.title}`}
      description={`Edit one lesson at a time. Use the sidebar to jump to the section you want to work on.`}
      contentChrome="plain"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-8 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Lesson editor</p>
              <p className="mt-2 text-sm text-slate-500">{course.title}</p>
            </div>
            <Button asChild variant="ghost">
              <Link href={`/admin/courses/${course.id}`}>Back to course</Link>
            </Button>
          </div>

          <div className="space-y-8 px-8 py-8">
            <form action={updateLessonAction} className="space-y-6">
              <input name="lessonId" type="hidden" value={lesson.id} />
              <div className="space-y-3">
                <Input
                  className="h-auto border-transparent bg-transparent px-0 py-0 font-[var(--font-display)] text-5xl tracking-tight text-slate-900 shadow-none focus:border-transparent focus:ring-0"
                  defaultValue={lesson.title}
                  name="title"
                  required
                />
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <label className="flex items-center gap-2">
                    <input defaultChecked={lesson.is_published} name="isPublished" type="checkbox" />
                    Published
                  </label>
                  <span>•</span>
                  <span>{sections.length} sections</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <Textarea
                  className="min-h-24 rounded-2xl border-slate-200 bg-stone-50/80 px-5 py-4 text-base"
                  defaultValue={lesson.task_prompt ?? ""}
                  name="taskPrompt"
                  placeholder="Add the task or deliverable for this lesson"
                />
                <div className="flex items-start justify-end">
                  <Button className="h-12 rounded-xl px-6" type="submit">
                    Save lesson
                  </Button>
                </div>
              </div>

              <details className="rounded-2xl border border-slate-200 bg-stone-50/70 p-5">
                <summary className="cursor-pointer text-sm font-medium text-slate-700">
                  Advanced lesson settings
                </summary>
                <div className="mt-4 grid gap-4">
                  <Textarea
                    defaultValue={lesson.content_markdown ?? ""}
                    name="contentMarkdown"
                    placeholder="Legacy markdown fallback (optional)"
                  />
                  <Input
                    defaultValue={lesson.video_url ?? ""}
                    name="videoUrl"
                    placeholder="Legacy embed URL fallback (optional)"
                  />
                </div>
              </details>
            </form>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Sections</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Use sections like GitBook pages inside the lesson. Pick one and edit it below.
                  </p>
                </div>
                <form action={createLessonSectionAction} className="flex flex-wrap items-center gap-3">
                  <input name="lessonId" type="hidden" value={lesson.id} />
                  <Input className="w-56" name="title" placeholder="New section title" required />
                  <Button type="submit" variant="outline">
                    Add section
                  </Button>
                </form>
              </div>

              {sections.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {sections.map((section) => (
                    <Link
                      key={section.id}
                      href={`#section-${section.id}`}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                    >
                      {section.title}
                    </Link>
                  ))}
                </div>
              ) : null}

              <details className="rounded-2xl border border-slate-200 bg-white/80 p-5">
                <summary className="cursor-pointer text-sm font-medium text-slate-700">
                  Reorder sections
                </summary>
                <div className="mt-4">
                  <SortableOrderForm
                    action={reorderLessonSectionsAction}
                    emptyLabel="No sections yet."
                    hiddenFields={{ lessonId }}
                    items={sections.map((section) => ({
                      id: section.id,
                      label: section.title,
                      detail: `${blocksBySectionId.get(section.id)?.length ?? 0} blocks`
                    }))}
                  />
                </div>
              </details>
            </div>

            {sections.length === 0 ? (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  Create a section, then open it from the left rail to start editing.
                </p>
              </Card>
            ) : (
              <LessonDocumentEditor
                sections={sections.map((section) => ({
                  id: section.id,
                  lessonId: lesson.id,
                  title: section.title,
                  position: section.position,
                  blocks: blocksBySectionId.get(section.id) ?? []
                }))}
              />
            )}
          </div>
        </div>
      </div>
    </AdminBuilderShell>
  );
}
