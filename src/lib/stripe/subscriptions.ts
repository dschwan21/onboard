import type Stripe from "stripe";

import {
  selectMaybeSingle,
  updateWhereEq,
  upsertRow
} from "@/lib/supabase/query-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];
type SubscriptionUpdate = Database["public"]["Tables"]["subscriptions"]["Update"];

function toIsoOrNull(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

export async function upsertSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  customerIdOverride?: string | null
) {
  const supabase = createAdminSupabaseClient();
  const customerId =
    customerIdOverride ??
    (typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id);

  const { data: existing } = await selectMaybeSingle<Pick<SubscriptionRow, "id" | "user_id">>(
    supabase,
    "subscriptions",
    "id,user_id",
    {
      column: "stripe_customer_id",
      value: customerId
    }
  );

  const userId = existing?.user_id ?? subscription.metadata.user_id;

  if (!userId) {
    throw new Error("Stripe subscription is missing user_id metadata.");
  }

  const payload: SubscriptionInsert = {
    id: existing?.id,
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price.id ?? null,
    status: subscription.status,
    current_period_end: toIsoOrNull(subscription.current_period_end)
  };

  await upsertRow(supabase, "subscriptions", payload, {
    onConflict: "user_id"
  });
}

export async function cancelSubscriptionByCustomerId(customerId: string) {
  const supabase = createAdminSupabaseClient();
  const payload: SubscriptionUpdate = {
    status: "canceled",
    current_period_end: null
  };

  await updateWhereEq(supabase, "subscriptions", payload, {
    column: "stripe_customer_id",
    value: customerId
  });
}
