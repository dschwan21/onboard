import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/course/:path*",
    "/ai-tools/:path*",
    "/community/:path*",
    "/live-sessions/:path*",
    "/library/:path*",
    "/billing/:path*",
    "/settings/:path*"
  ]
};
