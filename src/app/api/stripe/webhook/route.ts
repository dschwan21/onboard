import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getServerEnv } from "@/lib/config/env";
import { getStripe } from "@/lib/stripe/server";
import {
  cancelSubscriptionByCustomerId,
  upsertSubscriptionFromStripe
} from "@/lib/stripe/subscriptions";

export async function POST(request: Request) {
  const env = getServerEnv();
  const stripe = getStripe();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id
        );

        await upsertSubscriptionFromStripe(
          subscription,
          typeof session.customer === "string" ? session.customer : session.customer?.id
        );
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await upsertSubscriptionFromStripe(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      await cancelSubscriptionByCustomerId(customerId);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
