import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";

export default function CourseLoading() {
  return (
    <PageShell title="Course" description="Loading course content...">
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading course content...</p>
      </Card>
    </PageShell>
  );
}
