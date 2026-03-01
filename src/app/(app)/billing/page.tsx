import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { selectMaybeSingle } from "@/lib/supabase/query-helpers";
import type { Database } from "@/types/database";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

export default async function BillingPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reason = typeof params.reason === "string" ? params.reason : undefined;
  const { supabase, user } = await getCurrentUserProfile();
  const { data: subscription } = await selectMaybeSingle<SubscriptionRow>(
    supabase,
    "subscriptions",
    "*",
    {
      column: "user_id",
      value: user.id
    }
  );

  return (
    <PageShell
      title="Billing"
      description="Single-plan monthly subscription flow backed by Stripe Checkout and webhooks."
    >
      <div className="space-y-4">
        {reason === "pro_required" ? (
          <p className="text-sm text-accent">
            A Pro subscription is required for the requested route.
          </p>
        ) : null}
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Current status</p>
          <p className="mt-2 text-2xl font-semibold capitalize">
            {subscription?.status ?? "free"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Plan changes are synchronized from Stripe webhooks into the
            `subscriptions` table.
          </p>
          <form action="/api/stripe/checkout" method="post" className="mt-6">
            <Button type="submit">Start monthly subscription</Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
