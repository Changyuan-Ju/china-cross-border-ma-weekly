import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("中资企业跨境并购周报").first()).toBeVisible();
  await expect(page.getByText("本周交易")).toBeVisible();
  await expect(page.getByText("其他交易")).toHaveCount(0);
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

test("submit page keeps public lead submission simple", async ({ page }) => {
  await page.goto("/submit");
  await expect(page.getByRole("heading", { name: "补充交易" })).toBeVisible();
  await expect(page.getByLabel("标题")).toBeVisible();
  await expect(page.getByLabel("公告链接")).toBeVisible();
  await expect(page.getByRole("button", { name: "提交交易线索" })).toBeVisible();
});

test("weekly page shows candidate section and suggestion popover", async ({ page }) => {
  await page.goto("/weekly/2026-06-26-to-2026-07-03");
  await expect(page.getByRole("heading", { name: "本期其他候选交易" })).toBeVisible();
  await expect(page.getByText("已排除（9）")).toBeVisible();
  await page.getByRole("button", { name: "提出调整建议" }).first().click();
  await expect(page.getByLabel("建议操作")).toBeVisible();
  await expect(page.getByLabel("判断依据")).toBeVisible();
});

test("deal detail and archive use the editorial structure", async ({ page }) => {
  await page.goto("/deals/deal-linkutec-northstar-20260703");
  await expect(page.getByRole("heading", { name: "交易时间线" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "核心交易数据" })).toBeVisible();
  await page.goto("/archive");
  await expect(page.getByText("ARCHIVE")).toBeVisible();
  await expect(page.getByText("查看周报").first()).toBeVisible();
});
