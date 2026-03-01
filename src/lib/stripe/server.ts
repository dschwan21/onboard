import Stripe from "stripe";

import { getServerEnv } from "@/lib/config/env";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    const env = getServerEnv();
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}
