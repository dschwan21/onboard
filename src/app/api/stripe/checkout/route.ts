import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/config/env";
import { getStripe } from "@/lib/stripe/server";
import { selectMaybeSingle } from "@/lib/supabase/query-helpers";
import type { Database } from "@/types/database";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const env = getServerEnv();
  const stripe = getStripe();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/login`);
  }

  const { data: subscription } = await selectMaybeSingle<
    Pick<SubscriptionRow, "stripe_customer_id">
  >(supabase, "subscriptions", "stripe_customer_id", {
    column: "user_id",
    value: user.id
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: subscription?.stripe_customer_id ?? undefined,
    customer_email: subscription?.stripe_customer_id ? undefined : user.email,
    line_items: [
      {
        price: env.STRIPE_PRICE_ID,
        quantity: 1
      }
    ],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/billing?checkout=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/billing?checkout=cancelled`,
    metadata: {
      user_id: user.id
    },
    subscription_data: {
      metadata: {
        user_id: user.id
      }
    }
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe checkout session missing URL" }, { status: 500 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
