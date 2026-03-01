"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAVIGATION } from "@/lib/auth/config";
import { cn } from "@/lib/utils";

export function AppSidebar({
  email,
  role
}: {
  email: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-border bg-white/80 px-4 py-6 backdrop-blur">
      <div className="mb-8 px-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Onboard
        </p>
        <p className="mt-3 text-lg font-semibold">{email}</p>
        <p className="text-sm capitalize text-muted-foreground">{role}</p>
      </div>
      <nav className="space-y-1">
        {APP_NAVIGATION.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
              )}
            >
              <span>{item.label}</span>
              {item.pro ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.15em]",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-accent/15 text-accent"
                  )}
                >
                  Pro
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
