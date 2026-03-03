import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { signOutAction } from "@/app/(auth)/actions";
import { ADMIN_NAVIGATION, APP_NAVIGATION } from "@/lib/auth/config";
import Link from "next/link";

export default async function AuthenticatedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserProfile();

  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <div className="hidden lg:block">
        <AppSidebar
          email={user.email ?? "Unknown user"}
          role={profile?.role ?? "user"}
          isAdmin={profile?.role === "admin"}
        />
      </div>
      <div className="min-h-screen">
        <div className="flex items-center justify-between border-b border-border bg-white/70 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Authenticated workspace
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-b border-border bg-white/60 px-4 py-3 lg:hidden">
          {[...APP_NAVIGATION, ...(profile?.role === "admin" ? ADMIN_NAVIGATION : [])].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-[1700px] px-4 py-8 lg:px-6 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
