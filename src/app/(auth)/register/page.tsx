import Link from "next/link";

import { registerAction } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClientEnv } from "@/lib/config/env";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getClientEnv();
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <AuthShell
      title="Create your account"
      description="Profiles capture profession and organization at signup so learning can be tailored later."
      footer={
        <span>
          Already have an account?{" "}
          <Link className="font-medium text-primary" href="/login">
            Login
          </Link>
        </span>
      }
    >
      <form action={registerAction} className="space-y-4">
        <input type="hidden" name="origin" value={env.NEXT_PUBLIC_APP_URL} />
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profession">
              Profession
            </label>
            <Input id="profession" name="profession" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="organization">
              Organization
            </label>
            <Input id="organization" name="organization" required />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="confirmPassword">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            minLength={8}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="w-full" type="submit">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
