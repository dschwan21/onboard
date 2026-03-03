"use client";

import { startTransition, useEffect, useRef, useState } from "react";

import {
  createLessonBlockAction,
  deleteLessonBlockAction,
  duplicateLessonBlockAction,
  reorderLessonBlocksAction,
  updateLessonBlockAction,
  updateLessonSectionAction
} from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getYouTubeEmbedUrl, type LessonBlockRow, type LessonBlockType } from "@/lib/lesson-blocks";
import { cn } from "@/lib/utils";

type SectionDocument = {
  id: string;
  lessonId: string;
  title: string;
  position: number;
  blocks: LessonBlockRow[];
};

const BLOCK_TYPE_OPTIONS: Array<{ value: LessonBlockType; label: string }> = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading", label: "Heading" },
  { value: "markdown", label: "Markdown" },
  { value: "image", label: "Image" },
  { value: "gif", label: "GIF" },
  { value: "youtube", label: "YouTube" },
  { value: "embed", label: "Embed" }
];

function moveItem<T>(items: T[], from: number, to: number) {
  const nextItems = [...items];
  const [moved] = nextItems.splice(from, 1);
  nextItems.splice(to, 0, moved);
  return nextItems;
}

function blockHasMedia(type: LessonBlockType) {
  return type === "image" || type === "gif" || type === "youtube" || type === "embed";
}

function blockUsesLongText(type: LessonBlockType) {
  return type === "paragraph" || type === "markdown";
}

function AddBlockComposer({
  lessonId,
  sectionId,
  position,
  compact = false
}: {
  lessonId: string;
  sectionId: string;
  position: number;
  compact?: boolean;
}) {
  return (
    <details className={cn("group", compact ? "" : "rounded-2xl border border-dashed border-slate-300 bg-stone-50/70 p-5")}>
      <summary className="cursor-pointer list-none text-sm font-medium text-slate-500 transition group-open:text-slate-900">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 hover:border-slate-300">
          <span className="text-base">+</span>
          Add block
        </span>
      </summary>
      <form action={createLessonBlockAction} className={cn("grid gap-4", compact ? "mt-4 rounded-2xl border border-dashed border-slate-300 bg-stone-50/70 p-5 lg:grid-cols-[180px_minmax(0,1fr)_1fr]" : "mt-4 lg:grid-cols-[180px_minmax(0,1fr)_1fr]")}>
        <input name="lessonId" type="hidden" value={lessonId} />
        <input name="sectionId" type="hidden" value={sectionId} />
        <input name="position" type="hidden" value={position} />
        <label className="grid gap-2 text-sm">
          <span className="text-slate-600">Type</span>
          <select className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm" defaultValue="paragraph" name="blockType">
            {BLOCK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Input className="h-12 rounded-xl border-slate-200" name="content" placeholder="Text content or heading" />
        <Input className="h-12 rounded-xl border-slate-200" name="url" placeholder="Media URL or embed URL" />
        <Input className="h-12 rounded-xl border-slate-200 lg:col-span-2" name="caption" placeholder="Caption (optional)" />
        <div className="flex items-end justify-end gap-3">
          <Button className="h-12 rounded-xl px-6" type="submit">
            Add block
          </Button>
        </div>
      </form>
    </details>
  );
}

function BlockPreview({ block }: { block: LessonBlockRow }) {
  if ((block.type === "image" || block.type === "gif") && block.url) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={block.caption ?? block.content ?? "Block preview"} className="max-h-80 w-full object-cover" src={block.url} />
      </div>
    );
  }

  if (block.type === "youtube" && block.url) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
          src={getYouTubeEmbedUrl(block.url)}
          title={block.caption ?? "YouTube preview"}
        />
      </div>
    );
  }

  if (block.type === "embed" && block.url) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Embed preview available after save: {block.url}
      </div>
    );
  }

  return null;
}

function EditableBlock({
  block,
  lessonId,
  sectionId,
  index,
  total,
  onDragStart,
  onDrop
}: {
  block: LessonBlockRow;
  lessonId: string;
  sectionId: string;
  index: number;
  total: number;
  onDragStart: (blockId: string) => void;
  onDrop: (targetIndex: number) => void;
}) {
  const [type, setType] = useState<LessonBlockType>(block.type);

  useEffect(() => {
    setType(block.type);
  }, [block.type]);

  return (
    <Card className="group border-slate-200 bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex gap-4">
        <button
          className="mt-1 shrink-0 cursor-grab rounded-lg px-2 py-2 text-slate-400 transition hover:bg-stone-100 hover:text-slate-700"
          draggable
          onDragEnd={() => {
            onDragStart("");
          }}
          onDragStart={() => {
            onDragStart(block.id);
          }}
          type="button"
        >
          ::
        </button>

        <div
          className="min-w-0 flex-1"
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            onDrop(index);
          }}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  defaultValue={block.type}
                  form={`update-block-${block.id}`}
                  name="blockType"
                  onChange={(event) => {
                    setType(event.target.value as LessonBlockType);
                  }}
                >
                  {BLOCK_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Block {index + 1} of {total}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <form action={duplicateLessonBlockAction}>
                  <input name="lessonId" type="hidden" value={lessonId} />
                  <input name="blockId" type="hidden" value={block.id} />
                  <Button type="submit" variant="outline">
                    Duplicate
                  </Button>
                </form>
                <form action={deleteLessonBlockAction}>
                  <input name="lessonId" type="hidden" value={lessonId} />
                  <input name="blockId" type="hidden" value={block.id} />
                  <Button type="submit" variant="outline">
                    Delete
                  </Button>
                </form>
                <Button form={`update-block-${block.id}`} type="submit">
                  Save
                </Button>
              </div>
            </div>

            <form action={updateLessonBlockAction} className="space-y-4" id={`update-block-${block.id}`}>
              <input name="lessonId" type="hidden" value={lessonId} />
              <input name="sectionId" type="hidden" value={sectionId} />
              <input name="blockId" type="hidden" value={block.id} />

              {type === "heading" ? (
                <Input
                  className="h-auto border-transparent bg-transparent px-0 py-0 font-[var(--font-display)] text-3xl tracking-tight text-slate-900 shadow-none focus:border-transparent focus:ring-0"
                  defaultValue={block.content ?? ""}
                  name="content"
                  placeholder="Heading"
                />
              ) : blockUsesLongText(type) ? (
                <Textarea
                  className={cn(
                    "min-h-28 border-transparent bg-transparent px-0 py-0 text-lg leading-8 text-slate-700 shadow-none focus:border-transparent focus:ring-0",
                    type === "markdown" ? "font-mono text-base leading-7" : ""
                  )}
                  defaultValue={block.content ?? ""}
                  name="content"
                  placeholder={type === "markdown" ? "Write markdown..." : "Write content..."}
                />
              ) : (
                <Input
                  className="h-12 rounded-xl border-slate-200"
                  defaultValue={block.content ?? ""}
                  name="content"
                  placeholder="Text content or heading"
                />
              )}

              {blockHasMedia(type) ? (
                <div className="grid gap-4">
                  <Input
                    className="h-12 rounded-xl border-slate-200"
                    defaultValue={block.url ?? ""}
                    name="url"
                    placeholder="Media URL or embed URL"
                  />
                  <Input
                    className="h-12 rounded-xl border-slate-200"
                    defaultValue={block.caption ?? ""}
                    name="caption"
                    placeholder="Caption (optional)"
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    className="h-12 rounded-xl border-slate-200"
                    defaultValue={block.url ?? ""}
                    name="url"
                    placeholder="Optional URL"
                  />
                  <Input
                    className="h-12 rounded-xl border-slate-200"
                    defaultValue={block.caption ?? ""}
                    name="caption"
                    placeholder="Caption (optional)"
                  />
                </div>
              )}
            </form>

            <div className="mt-4">
              <BlockPreview block={{ ...block, type }} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function LessonDocumentEditor({ sections }: { sections: SectionDocument[] }) {
  const [sectionBlocks, setSectionBlocks] = useState<Record<string, LessonBlockRow[]>>(
    Object.fromEntries(sections.map((section) => [section.id, section.blocks]))
  );
  const [draggedBlock, setDraggedBlock] = useState<{ sectionId: string; blockId: string } | null>(null);
  const formRefs = useRef<Record<string, HTMLFormElement | null>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setSectionBlocks(Object.fromEntries(sections.map((section) => [section.id, section.blocks])));
  }, [sections]);

  function commitSectionOrder(sectionId: string, nextBlocks: LessonBlockRow[]) {
    setSectionBlocks((current) => ({
      ...current,
      [sectionId]: nextBlocks
    }));

    startTransition(() => {
      const input = inputRefs.current[sectionId];
      const form = formRefs.current[sectionId];

      if (!input || !form) {
        return;
      }

      input.value = nextBlocks.map((block) => block.id).join(",");
      form.requestSubmit();
    });
  }

  return (
    <div className="space-y-10">
      {sections.map((section) => {
        const blocks = sectionBlocks[section.id] ?? [];

        return (
          <section
            id={`section-${section.id}`}
            key={section.id}
            className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
          >
            <div className="border-b border-slate-200 px-8 py-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Section {section.position}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-[var(--font-display)] text-4xl tracking-tight text-slate-900">
                  {section.title}
                </h2>
                <form action={updateLessonSectionAction} className="flex flex-wrap items-center gap-3">
                  <input name="lessonId" type="hidden" value={section.lessonId} />
                  <input name="sectionId" type="hidden" value={section.id} />
                  <Input className="w-72" defaultValue={section.title} name="title" required />
                  <Button type="submit">Save section</Button>
                </form>
              </div>
            </div>

            <div className="space-y-8 px-8 py-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Section blocks</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Drag blocks to reorder, insert new ones between ideas, and edit content directly in the page.
                </p>
              </div>

              <form action={reorderLessonBlocksAction} ref={(element) => {
                formRefs.current[section.id] = element;
              }}>
                <input name="lessonId" type="hidden" value={section.lessonId} />
                <input name="sectionId" type="hidden" value={section.id} />
                <input
                  defaultValue={blocks.map((block) => block.id).join(",")}
                  name="orderedIds"
                  ref={(element) => {
                    inputRefs.current[section.id] = element;
                  }}
                  type="hidden"
                />
              </form>

              <AddBlockComposer lessonId={section.lessonId} position={1} sectionId={section.id} />

              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <div key={block.id} className="space-y-4">
                    <EditableBlock
                      block={block}
                      index={index}
                      lessonId={section.lessonId}
                      onDragStart={(blockId) => {
                        setDraggedBlock(blockId ? { sectionId: section.id, blockId } : null);
                      }}
                      onDrop={(targetIndex) => {
                        if (!draggedBlock || draggedBlock.sectionId !== section.id) {
                          return;
                        }

                        const sourceIndex = blocks.findIndex((entry) => entry.id === draggedBlock.blockId);

                        if (sourceIndex === -1 || sourceIndex === targetIndex) {
                          setDraggedBlock(null);
                          return;
                        }

                        commitSectionOrder(section.id, moveItem(blocks, sourceIndex, targetIndex));
                        setDraggedBlock(null);
                      }}
                      sectionId={section.id}
                      total={blocks.length}
                    />
                    <AddBlockComposer
                      compact
                      lessonId={section.lessonId}
                      position={index + 2}
                      sectionId={section.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
