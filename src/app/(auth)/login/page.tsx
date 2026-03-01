import Link from "next/link";

import { loginAction } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClientEnv } from "@/lib/config/env";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getClientEnv();
  const error = typeof params.error === "string" ? params.error : undefined;
  const message = typeof params.message === "string" ? params.message : undefined;
  const next = typeof params.next === "string" ? params.next : "/dashboard";

  return (
    <AuthShell
      title="Welcome back"
      description="Email/password and Google OAuth are both configured through Supabase."
      footer={
        <span>
          Need an account?{" "}
          <Link className="font-medium text-primary" href="/register">
            Register
          </Link>
        </span>
      }
    >
      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input id="password" name="password" type="password" required />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-primary">{message}</p> : null}
        <Button className="w-full" type="submit">
          Login
        </Button>
      </form>
      <GoogleSignInButton appUrl={env.NEXT_PUBLIC_APP_URL} next={next} />
    </AuthShell>
  );
}
