import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-4 text-sm leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="text-3xl font-semibold" {...props} />,
          h2: (props) => <h2 className="text-2xl font-semibold" {...props} />,
          h3: (props) => <h3 className="text-xl font-semibold" {...props} />,
          p: (props) => <p className="text-base text-foreground/90" {...props} />,
          ul: (props) => <ul className="list-disc space-y-2 pl-5" {...props} />,
          ol: (props) => <ol className="list-decimal space-y-2 pl-5" {...props} />,
          li: (props) => <li className="text-base text-foreground/90" {...props} />,
          a: (props) => (
            <a className="text-primary underline underline-offset-4" {...props} />
          ),
          blockquote: (props) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic" {...props} />
          ),
          code: ({ inline, className, children, ...props }: React.ComponentProps<"code"> & { inline?: boolean }) =>
            inline ? (
              <code className="rounded bg-secondary px-1.5 py-0.5 text-sm" {...props}>
                {children}
              </code>
            ) : (
              <code className={cn("block overflow-x-auto rounded-xl bg-secondary p-4 text-sm", className)} {...props}>
                {children}
              </code>
            )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
