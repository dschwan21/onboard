import type { Database } from "@/types/database";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
export type LessonBlockRow = Database["public"]["Tables"]["lesson_blocks"]["Row"];
export type LessonBlockType = LessonBlockRow["type"];

export function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return url;
  }

  return url;
}

export function getBlockDisplayName(block: Pick<LessonBlockRow, "type" | "content" | "caption" | "url">) {
  const label = block.content?.trim() || block.caption?.trim() || block.url?.trim() || "Untitled block";
  return `${block.type}: ${label}`;
}

export function buildLegacyLessonBlocks(lesson: LessonRow): LessonBlockRow[] {
  const blocks: LessonBlockRow[] = [];
  const timestamp = lesson.created_at;
  const fallbackSectionId = `${lesson.id}-legacy-section`;

  if (lesson.video_url) {
    blocks.push({
      id: `${lesson.id}-legacy-video`,
      lesson_id: lesson.id,
      lesson_section_id: fallbackSectionId,
      type: lesson.video_url.includes("youtube") || lesson.video_url.includes("youtu.be") ? "youtube" : "embed",
      content: null,
      url: lesson.video_url,
      caption: null,
      position: blocks.length + 1,
      created_at: timestamp,
      updated_at: timestamp
    });
  }

  if (lesson.content_markdown?.trim()) {
    blocks.push({
      id: `${lesson.id}-legacy-markdown`,
      lesson_id: lesson.id,
      lesson_section_id: fallbackSectionId,
      type: "markdown",
      content: lesson.content_markdown,
      url: null,
      caption: null,
      position: blocks.length + 1,
      created_at: timestamp,
      updated_at: timestamp
    });
  }

  return blocks;
}

export function getRenderableLessonBlocks(lesson: LessonRow, blocks: LessonBlockRow[]) {
  return blocks.length > 0 ? blocks : buildLegacyLessonBlocks(lesson);
}
