import {
  APP_ROUTES,
  PRO_ROUTES,
  isAppRoute,
  isProRoute,
  pathMatchesRoute
} from "@/lib/route-guards";

describe("route-guards", () => {
  it("matches exact and nested protected routes", () => {
    expect(pathMatchesRoute("/course", "/course")).toBe(true);
    expect(pathMatchesRoute("/course/course-1", "/course")).toBe(true);
    expect(pathMatchesRoute("/courses", "/course")).toBe(false);
  });

  it("identifies authenticated app routes", () => {
    expect(APP_ROUTES).toContain("/dashboard");
    expect(isAppRoute("/dashboard")).toBe(true);
    expect(isAppRoute("/course/course-1/lesson-1")).toBe(true);
    expect(isAppRoute("/login")).toBe(false);
  });

  it("identifies pro-only routes", () => {
    expect(PRO_ROUTES).toEqual(["/ai-tools", "/library"]);
    expect(isProRoute("/ai-tools")).toBe(true);
    expect(isProRoute("/library/templates")).toBe(true);
    expect(isProRoute("/course")).toBe(false);
  });
});
