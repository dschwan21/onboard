"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton({
  appUrl,
  next
}: {
  appUrl: string;
  next: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      setError(null);
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`
        }
      });

      if (signInError) {
        setError(signInError.message);
      }
    });
  };

  return (
    <div className="mt-3">
      <Button className="w-full" onClick={handleClick} type="button" variant="outline">
        {isPending ? "Redirecting..." : "Continue with Google"}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
