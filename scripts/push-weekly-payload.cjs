const fs = require("node:fs");

function loadEnv() {
  const env = {};
  if (!fs.existsSync(".env")) return env;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[match[1]] = value;
  }
  return env;
}

async function main() {
  const payloadPath = process.argv[2];
  const url = process.argv[3];
  const repeat = Number(process.argv[4] || "1");
  if (!payloadPath || !url) throw new Error("Usage: node scripts/push-weekly-payload.cjs <payload.json> <url> [repeat]");
  const env = loadEnv();
  if (!env.INGEST_API_TOKEN) throw new Error("INGEST_API_TOKEN is not set");
  const body = fs.readFileSync(payloadPath, "utf8");
  for (let i = 1; i <= repeat; i += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.INGEST_API_TOKEN}`
      },
      body
    });
    const text = await response.text();
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }
    console.log(`push_${i}_status=${response.status}`);
    console.log(`push_${i}_ok=${parsed.ok === true}`);
    console.log(`push_${i}_accepted=${parsed.accepted ?? "NA"}`);
  }
}

main().catch((error) => {
  console.error(`push_error=${error.name}:${error.message}`);
  process.exit(1);
});
