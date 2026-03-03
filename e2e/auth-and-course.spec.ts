import { expect, test, type Page } from "@playwright/test";

import {
  createManagedUser,
  deleteManagedUser,
  seedPublishedCourse
} from "./helpers/supabase-admin";

const password = "Password123!";

async function loginAs(page: Page, credentials: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
}

test.describe("auth and course flows", () => {
  let adminUser: { id: string; email: string; password: string };
  let learnerUser: { id: string; email: string; password: string };
  let seededCourse: { courseId: string; title: string };

  test.beforeAll(async () => {
    adminUser = await createManagedUser({
      emailPrefix: "onboard-admin",
      password,
      role: "admin"
    });
    learnerUser = await createManagedUser({
      emailPrefix: "onboard-learner",
      password,
      role: "user"
    });
    seededCourse = await seedPublishedCourse();
  });

  test.afterAll(async () => {
    if (adminUser) {
      await deleteManagedUser(adminUser.id);
    }

    if (learnerUser) {
      await deleteManagedUser(learnerUser.id);
    }
  });

  test("signup flow reaches either verify-email/dashboard or shows a rate-limit message", async ({
    page
  }) => {
    const email = `signup.${Date.now()}@gmail.com`;
    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Profession").fill("Operations");
    await page.getByLabel("Organization").fill("Onboard");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await Promise.race([
      expect(page).toHaveURL(/\/(verify-email|dashboard|login)/, { timeout: 15_000 }),
      expect(page.getByText("email rate limit exceeded")).toBeVisible({ timeout: 15_000 })
    ]);
  });

  test("login flow reaches the dashboard", async ({ page }) => {
    await loginAs(page, learnerUser);
    await expect(page.getByText(`Signed in as ${learnerUser.email}`)).toBeVisible();
  });

  test("admin can create a course from the CMS", async ({ page }) => {
    await loginAs(page, adminUser);
    await page.goto("/admin/courses");
    await page.getByPlaceholder("Course title").fill(`Playwright Course ${Date.now()}`);
    await page.getByPlaceholder("Course description").fill("Created in e2e");
    await page.getByRole("button", { name: "Create course" }).click();

    await expect(page).toHaveURL(/\/admin\/courses\/.+/, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Save course" })).toBeVisible({
      timeout: 15_000
    });
  });

  test("learner can submit a lesson and see completion state", async ({ page }) => {
    await loginAs(page, learnerUser);
    await page.goto(`/course/${seededCourse.courseId}`);
    await expect(page.getByText(seededCourse.title)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Open lesson" }).first()).toBeVisible({
      timeout: 15_000
    });
    await page.getByRole("link", { name: "Open lesson" }).first().click();
    await page.getByPlaceholder("Write your response, notes, or deliverable here.").fill("My completed task");
    await page.getByRole("button", { name: "Submit work" }).click();

    await expect(page.getByText("Lesson completed.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Next lesson" })).toBeVisible({
      timeout: 15_000
    });
  });
});
