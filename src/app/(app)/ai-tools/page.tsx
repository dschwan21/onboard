import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";

export default function AIToolsPage() {
  return (
    <PageShell
      title="AI Tools"
      description="Pro-only tool workspace that will call the single server-side /api/ai route."
    >
      <Card className="border-dashed p-6">
        <p className="text-sm text-muted-foreground">
          Route protection is active for this section. Future tools should post a
          `toolType` and structured `input` payload to `/api/ai`.
        </p>
      </Card>
    </PageShell>
  );
}
