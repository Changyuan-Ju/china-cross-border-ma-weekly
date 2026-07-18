const fs = require("node:fs");
const path = require("node:path");

const baseUrl = process.env.TEASER_SITE_URL || "https://china-cross-border-ma-weekly.vercel.app";
const documentId = process.argv[2];
const action = process.argv[3] || "status";
const provider = process.argv[4] || "auto";

if (!documentId) throw new Error("Usage: node scripts/teaser-production-check.cjs <document-id> <status|download|process|preview> [auto|qwen|gemini]");

function configuredPassword() {
  if (!process.env.TEASER_ADMIN_PASSWORD) {
    throw new Error("Set TEASER_ADMIN_PASSWORD before running the production check");
  }
  return process.env.TEASER_ADMIN_PASSWORD;
}

async function login() {
  const response = await fetch(`${baseUrl}/api/teasers/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "HTLH-IIB-Admin", password: configuredPassword() })
  });
  if (!response.ok) throw new Error(`Production login failed (${response.status})`);
  const setCookie = response.headers.getSetCookie?.()[0] || response.headers.get("set-cookie");
  if (!setCookie) throw new Error("Production login returned no session cookie");
  return setCookie.split(";")[0];
}

async function readDashboard(cookie) {
  const response = await fetch(`${baseUrl}/api/teasers`, { headers: { cookie }, cache: "no-store" });
  if (!response.ok) throw new Error(`Dashboard request failed (${response.status})`);
  return response.json();
}

function findDocument(dashboard) {
  const documents = [
    ...(dashboard.orphanDocuments || []),
    ...(dashboard.opportunities || []).flatMap((item) => item.documents || [])
  ];
  return documents.find((item) => item.id === documentId);
}

async function main() {
  const cookie = await login();

  if (action === "download") {
    const response = await fetch(`${baseUrl}/api/teasers/download/${documentId}`, { headers: { cookie } });
    if (!response.ok) throw new Error(`Download failed (${response.status})`);
    const outputDir = path.join(process.cwd(), "tmp", "pdfs");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, "Vision_Teaser.pdf");
    fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
    console.log(JSON.stringify({ ok: true, action, outputPath, bytes: fs.statSync(outputPath).size }));
    return;
  }

  if (action === "process" || action === "preview") {
    const response = await fetch(`${baseUrl}/api/teasers/process/${documentId}`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ force: action === "process", preview: action === "preview", provider }),
      signal: AbortSignal.timeout(330_000)
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`${action} failed (${response.status}): ${JSON.stringify(body).slice(0, 300)}`);
    if (action === "preview") {
      const outputDir = path.join(process.cwd(), "tmp", "pdfs");
      fs.mkdirSync(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, `${provider}-extraction.json`);
      fs.writeFileSync(outputPath, JSON.stringify(body.extraction, null, 2));
      console.log(JSON.stringify({ ok: true, action, provider, outputPath }));
      return;
    }
  }

  const dashboard = await readDashboard(cookie);
  if (action === "snapshot") {
    const outputDir = path.join(process.cwd(), "tmp", "pdfs");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, "teaser-dashboard-snapshot.json");
    fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2));
    console.log(JSON.stringify({ ok: true, action, outputPath, opportunityCount: (dashboard.opportunities || []).length }));
    return;
  }
  const document = findDocument(dashboard);
  console.log(JSON.stringify({
    ok: true,
    fileName: document?.fileName,
    status: document?.status,
    processedAt: document?.processedAt,
    errorMessage: document?.errorMessage,
    opportunityCount: (dashboard.opportunities || []).length
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
