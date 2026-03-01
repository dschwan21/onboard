import Link from "next/link";

import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-none bg-primary p-10 text-primary-foreground shadow-2xl shadow-primary/20">
          <Link href="/" className="text-sm uppercase tracking-[0.3em] text-primary-foreground/70">
            Onboard
          </Link>
          <h1 className="mt-6 max-w-md font-[var(--font-display)] text-4xl leading-tight">
            AI fluency for teams that need leverage, not jargon.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-primary-foreground/85">
            Authentication, billing, and data permissions are wired so you can
            grow features on top of a stable SaaS core.
          </p>
        </Card>
        <Card className="p-8">
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </Card>
      </div>
    </main>
  );
}
