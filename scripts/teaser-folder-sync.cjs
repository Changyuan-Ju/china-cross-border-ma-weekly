const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { loadEnvConfig } = require("@next/env");

const hasProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
if (hasProxy && !process.env.TEASER_PROXY_BOOTSTRAPPED) {
  const result = spawnSync(process.execPath, ["--use-env-proxy", ...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, TEASER_PROXY_BOOTSTRAPPED: "1" }
  });
  process.exit(result.status ?? 1);
}

loadEnvConfig(process.cwd(), true);

const folder = process.env.TEASER_LOCAL_FOLDER;
const endpoint = process.env.TEASER_SYNC_ENDPOINT || "http://localhost:3000/api/teasers/sync";
const structuredEndpoint = process.env.TEASER_LOCAL_STRUCTURED_ENDPOINT || endpoint.replace(/\/sync$/, "/local-structured");
const token = process.env.TEASER_SYNC_TOKEN || process.env.INGEST_API_TOKEN;
const watch = process.argv.includes("--watch");
const dryRun = process.argv.includes("--dry-run");
const structuredOnly = process.argv.includes("--structured-only");
const connectivityCheck = process.argv.includes("--check-connection");
const supported = new Set([".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".png", ".jpg", ".jpeg"]);
const statePath = path.join(process.cwd(), "data", "teaser-sync-state.json");
const manifestPath = path.join(path.resolve(folder || "."), "structured-manifest.json");

if (!folder || (!token && !dryRun)) {
  console.error("Set TEASER_LOCAL_FOLDER and TEASER_SYNC_TOKEN before running the teaser sync service.");
  process.exit(1);
}

async function loadState() {
  try {
    return JSON.parse(await fs.readFile(statePath, "utf8"));
  } catch {
    return {};
  }
}

async function saveState(state) {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

async function listFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith("~$") || entry.name.startsWith(".")) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(absolute)));
    else if (entry.isFile() && supported.has(path.extname(entry.name).toLowerCase())) files.push(absolute);
  }
  return files;
}

async function signature(filePath, manifestFiles) {
  const stat = await fs.stat(filePath);
  const metadata = await structuredMetadata(filePath, manifestFiles);
  const metadataHash = metadata ? crypto.createHash("sha256").update(metadata).digest("hex").slice(0, 12) : "unstructured";
  return `${stat.size}:${Math.round(stat.mtimeMs)}:${metadataHash}`;
}

async function loadStructuredManifest() {
  let batchFiles = {};
  try {
    batchFiles = require(path.join(path.dirname(manifestPath), "structured-batch-2026-07-15.cjs"));
  } catch {}
  try {
    const parsed = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    return parsed && typeof parsed.files === "object" ? { ...parsed.files, ...batchFiles } : batchFiles;
  } catch {
    return batchFiles;
  }
}

function resolveManifestEntry(files, fileName, seen = new Set()) {
  if (seen.has(fileName)) throw new Error(`Circular structured manifest reference: ${fileName}`);
  const entry = files[fileName];
  if (!entry) return null;
  if (!entry.$ref) return entry;
  seen.add(fileName);
  const base = resolveManifestEntry(files, entry.$ref, seen);
  if (!base) throw new Error(`Missing structured manifest reference: ${entry.$ref}`);
  return { ...base, ...(entry.overrides || {}) };
}

async function structuredMetadata(filePath, manifestFiles) {
  try { return await fs.readFile(`${filePath}.structured.json`, "utf8"); } catch {}
  const manifestEntry = resolveManifestEntry(manifestFiles, path.basename(filePath));
  return manifestEntry ? JSON.stringify(manifestEntry) : null;
}

async function fetchWithRetry(url, options, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(180_000) });
      if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
        continue;
      }
    }
  }
  const reason = lastError?.cause?.code || lastError?.message || "unknown network error";
  throw new Error(`Network request failed after ${attempts} attempts (${reason})`);
}

async function upload(filePath, manifestFiles) {
  const bytes = await fs.readFile(filePath);
  const metadata = await structuredMetadata(filePath, manifestFiles);
  if (structuredOnly && !metadata) return { skipped: true };
  const form = new FormData();
  form.append("file", new Blob([bytes]), path.basename(filePath));
  form.append("sourcePath", path.dirname(filePath));
  if (metadata) form.append("metadata", metadata);
  const response = await fetchWithRetry(metadata ? structuredEndpoint : endpoint, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status} ${body.error || response.statusText}`);
  const shortHash = crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 10);
  console.log(`${metadata ? "locally-structured" : body.duplicate ? "duplicate" : "uploaded"} ${shortHash} ${filePath}`);
  return { skipped: false };
}

async function run() {
  if (connectivityCheck) {
    const response = await fetchWithRetry(structuredEndpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: new FormData()
    });
    const body = await response.json().catch(() => ({}));
    if (response.status !== 400 || !["file_required", "file_and_metadata_required"].includes(body.error)) {
      throw new Error(`Teaser endpoint check failed: ${response.status} ${body.error || response.statusText}`);
    }
    console.log("Teaser endpoint check passed: network, production endpoint and token are ready.");
    return;
  }
  const state = await loadState();
  const manifestFiles = await loadStructuredManifest();
  const files = await listFiles(path.resolve(folder));
  if (dryRun) {
    const stats = await Promise.all(files.map((filePath) => fs.stat(filePath)));
    const totalBytes = stats.reduce((sum, stat) => sum + stat.size, 0);
    const structured = await Promise.all(files.map((filePath) => structuredMetadata(filePath, manifestFiles)));
    const structuredCount = structured.filter(Boolean).length;
    console.log(`Teaser sync dry run: ${files.length} supported file(s), ${structuredCount} structured, ${files.length - structuredCount} intentionally skipped, ${(totalBytes / 1024 / 1024).toFixed(1)} MB total.`);
    return;
  }
  let changed = 0;
  for (const filePath of files) {
    const current = await signature(filePath, manifestFiles);
    if (state[filePath] === current) continue;
    try {
      const result = await upload(filePath, manifestFiles);
      if (result.skipped) continue;
      state[filePath] = current;
      changed += 1;
      await saveState(state);
    } catch (error) {
      console.error(`failed ${filePath}: ${error.message}`);
    }
  }
  console.log(`Teaser sync complete: ${changed} changed file(s), ${files.length} supported file(s) scanned.`);
}

async function main() {
  await run();
  if (!watch) return;
  console.log("Watching for changes every 30 seconds. Press Ctrl+C to stop.");
  setInterval(() => run().catch((error) => console.error(error.message)), 30_000);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
