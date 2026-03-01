import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";

export default function AdminCoursesLoading() {
  return (
    <PageShell title="Admin Courses" description="Loading course management...">
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading course management...</p>
      </Card>
    </PageShell>
  );
}
