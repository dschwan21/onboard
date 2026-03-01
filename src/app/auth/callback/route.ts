import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";
import type { Database } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const redirectUrl = `${origin}${next}`;
  const response = NextResponse.redirect(redirectUrl);

  if (code) {
    const env = getClientEnv();
    const requestCookies = request.headers.get("cookie") ?? "";
    const supabase = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return requestCookies
              .split(";")
              .map((cookie) => cookie.trim())
              .filter(Boolean)
              .map((cookie) => {
                const [name, ...valueParts] = cookie.split("=");
                return {
                  name,
                  value: valueParts.join("=")
                };
              });
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          }
        }
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
