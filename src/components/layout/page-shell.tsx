import { Card } from "@/components/ui/card";

export function PageShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[var(--font-display)] text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </header>
      <Card className="p-6">
        {children ?? (
          <p className="text-sm text-muted-foreground">
            Placeholder page. Feature logic will be added in the next build
            steps.
          </p>
        )}
      </Card>
    </div>
  );
}
