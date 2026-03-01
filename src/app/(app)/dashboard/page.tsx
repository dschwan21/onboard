import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { selectMaybeSingle } from "@/lib/supabase/query-helpers";
import type { Database } from "@/types/database";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

export default async function DashboardPage() {
  const { profile, supabase, user } = await getCurrentUserProfile();
  const { data: subscription } = await selectMaybeSingle<
    Pick<SubscriptionRow, "status" | "current_period_end">
  >(supabase, "subscriptions", "status,current_period_end", {
    column: "user_id",
    value: user.id
  });

  return (
    <PageShell
      title="Dashboard"
      description="Initial member overview for profile, access level, and subscription state."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Role</p>
          <p className="mt-2 text-xl font-semibold capitalize">{profile?.role ?? "user"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Profession</p>
          <p className="mt-2 text-xl font-semibold">{profile?.profession ?? "Unset"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Subscription</p>
          <p className="mt-2 text-xl font-semibold capitalize">
            {subscription?.status ?? "free"}
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
