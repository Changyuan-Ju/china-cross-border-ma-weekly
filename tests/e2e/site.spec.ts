import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("中资企业跨境并购周报").first()).toBeVisible();
  await expect(page.getByText("本周重点交易")).toBeVisible();
});

test("deals search controls are usable", async ({ page }) => {
  await page.goto("/deals");
  await page.getByPlaceholder("搜索公司、证券代码、标的或正文").fill("Demo");
  await page.getByRole("button", { name: "搜索" }).click();
  await expect(page.getByRole("heading", { name: "交易数据库" })).toBeVisible();
});

test("archive and methodology pages load", async ({ page }) => {
  await page.goto("/archive");
  await expect(page.getByRole("heading", { name: "历史周报" })).toBeVisible();
  await page.goto("/methodology");
  await expect(page.getByRole("heading", { name: "方法说明" })).toBeVisible();
});
