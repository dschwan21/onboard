import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : undefined;

  return (
    <AuthShell
      title="Confirm your email"
      description="Your account was created. One more confirmation step is required before password login is active."
      footer={
        <span>
          Already confirmed?{" "}
          <Link className="font-medium text-primary" href="/login">
            Login
          </Link>
        </span>
      }
    >
      <VerifyEmailStatus email={email} />
    </AuthShell>
  );
}
