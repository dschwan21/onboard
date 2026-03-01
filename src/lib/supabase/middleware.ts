import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getClientEnv } from "@/lib/config/env";
import type { Database } from "@/types/database";

const APP_ROUTES = [
  "/dashboard",
  "/course",
  "/ai-tools",
  "/community",
  "/live-sessions",
  "/library",
  "/billing",
  "/settings"
];

const PRO_ROUTES = ["/ai-tools", "/library"];

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });
  const env = getClientEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAppRoute = APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isProRoute = PRO_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isProRoute && user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (!subscription) {
      const url = request.nextUrl.clone();
      url.pathname = "/billing";
      url.searchParams.set("reason", "pro_required");
      return NextResponse.redirect(url);
    }
  }

  return response;
}
