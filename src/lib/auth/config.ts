type AppNavigationItem = {
  href: string;
  label: string;
  pro?: boolean;
};

export const APP_NAVIGATION: readonly AppNavigationItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/course", label: "Course" },
  { href: "/ai-tools", label: "AI Tools", pro: true },
  { href: "/community", label: "Community" },
  { href: "/live-sessions", label: "Live Sessions" },
  { href: "/library", label: "Library", pro: true },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" }
] as const;

export const USER_ROLES = ["user", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];
