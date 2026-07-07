const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const baseUrl = process.argv[2] || "http://127.0.0.1:3000";
const outputRoot = process.argv[3] || "design-audit/after";

const pages = [
  ["home-desktop", "/"],
  ["weekly-desktop", "/weekly/2026-06-26-to-2026-07-03"],
  ["deals-desktop", "/deals"],
  ["deal-detail-desktop", "/deals/deal-linkutec-northstar-20260703"],
  ["archive-desktop", "/archive"],
  ["methodology-desktop", "/methodology"],
  ["submit-desktop", "/submit"]
];

async function capturePage(page, name, route, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${baseUrl.replace(/\/$/, "")}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outputRoot, `${name}.png`), fullPage: true });
}

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, route] of pages) {
    await capturePage(page, name, route, { width: 1440, height: 1000 });
  }
  await capturePage(page, "home-mobile", "/", { width: 390, height: 900 });
  await capturePage(page, "weekly-mobile", "/weekly/2026-06-26-to-2026-07-03", { width: 390, height: 900 });
  await capturePage(page, "submit-mobile", "/submit", { width: 390, height: 900 });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl.replace(/\/$/, "")}/weekly/2026-06-26-to-2026-07-03`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "提出调整建议" }).first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outputRoot, "suggestion-popover.png"), fullPage: false });
  await browser.close();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
