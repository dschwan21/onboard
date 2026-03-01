"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function VerifyEmailStatus({ email }: { email?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"waiting" | "confirmed">("waiting");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!cancelled && session) {
        setStatus("confirmed");
        router.replace("/dashboard");
      }
    };

    void checkSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setStatus("confirmed");
        router.replace("/dashboard");
      }
    });

    const interval = window.setInterval(() => {
      void checkSession();
    }, 3000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [router]);

  const handleCheckAgain = async () => {
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session) {
      setStatus("confirmed");
      router.replace("/dashboard");
      return;
    }

    setMessage("No session yet. Confirm the email in your inbox, then try again.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-secondary p-4">
        <p className="text-sm text-muted-foreground">Confirmation destination</p>
        <p className="mt-1 font-medium">{email ?? "Your inbox"}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Check your email and click the confirmation link. If the confirmation
        completes in this browser, this page will send you into the dashboard.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleCheckAgain} type="button">
          {status === "confirmed" ? "Continuing..." : "I confirmed my email"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
