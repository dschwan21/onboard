import { MarkdownContent } from "@/components/course/markdown-content";
import { Card } from "@/components/ui/card";
import {
  getYouTubeEmbedUrl,
  type LessonBlockRow
} from "@/lib/lesson-blocks";

export function LessonBlocksRenderer({ blocks }: { blocks: LessonBlockRow[] }) {
  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">Lesson content coming soon.</p>;
  }

  return (
    <div className="space-y-5">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading":
            return (
              <h2 key={block.id} className="font-[var(--font-display)] text-3xl">
                {block.content}
              </h2>
            );
          case "paragraph":
            return (
              <p key={block.id} className="whitespace-pre-wrap leading-7 text-foreground/90">
                {block.content}
              </p>
            );
          case "markdown":
            return <MarkdownContent key={block.id} content={block.content ?? ""} />;
          case "image":
          case "gif":
            return (
              <figure key={block.id} className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={block.caption ?? block.content ?? "Lesson media"}
                  className="w-full rounded-2xl border border-border object-cover"
                  src={block.url ?? ""}
                />
                {block.caption ? (
                  <figcaption className="text-sm text-muted-foreground">{block.caption}</figcaption>
                ) : null}
              </figure>
            );
          case "youtube":
          case "embed":
            return (
              <Card key={block.id} className="overflow-hidden p-0">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full"
                  src={block.type === "youtube" && block.url ? getYouTubeEmbedUrl(block.url) : (block.url ?? "")}
                  title={block.caption ?? block.content ?? "Lesson embed"}
                />
                {block.caption ? (
                  <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                    {block.caption}
                  </div>
                ) : null}
              </Card>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
