import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  "Structured AI courses for professionals",
  "Built-in AI productivity workflows",
  "Community groups and live sessions",
  "Subscription-ready architecture"
];

export default function MarketingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-14 px-6 py-10 md:px-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
            Onboard
          </p>
          <h1 className="mt-3 max-w-2xl font-[var(--font-display)] text-4xl leading-tight md:text-6xl">
            Become fluent in AI without becoming an engineer.
          </h1>
        </div>
        <div className="hidden gap-3 md:flex">
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Start learning</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <Card className="border-none bg-primary px-8 py-10 text-primary-foreground shadow-xl shadow-primary/20">
          <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/80">
            Foundation build
          </p>
          <p className="mt-4 max-w-xl text-lg leading-8 text-primary-foreground/90">
            This implementation ships the core SaaS architecture: auth, route
            protection, Stripe billing, Supabase persistence, and a single AI
            API surface for future tools.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild className="bg-white text-primary hover:bg-white/90">
              <Link href="/register">Create account</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/40 text-white">
              <Link href="/dashboard">Open app</Link>
            </Button>
          </div>
        </Card>

        <div className="grid gap-4">
          {features.map((feature) => (
            <Card key={feature} className="bg-card/85 px-5 py-4 backdrop-blur">
              <p className="text-sm text-muted-foreground">Included</p>
              <p className="mt-2 text-lg font-medium">{feature}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
