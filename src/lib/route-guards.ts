export const APP_ROUTES = [
  "/dashboard",
  "/course",
  "/ai-tools",
  "/community",
  "/live-sessions",
  "/library",
  "/billing",
  "/settings"
];

export const PRO_ROUTES = ["/ai-tools", "/library"];

export function pathMatchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isAppRoute(pathname: string) {
  return APP_ROUTES.some((route) => pathMatchesRoute(pathname, route));
}

export function isProRoute(pathname: string) {
  return PRO_ROUTES.some((route) => pathMatchesRoute(pathname, route));
}
