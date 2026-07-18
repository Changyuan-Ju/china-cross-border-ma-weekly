# Cross-border M&A Weekly

Editor / creator: Changyuan Ju.

This project is a Next.js website for a weekly cross-border M&A database focused on Chinese companies. It supports weekly issues, deal search, deal detail pages, protected ingestion, local JSON import for testing, and a production PostgreSQL schema via Prisma.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL for production
- Local JSON store only for local development and tests

## Local setup

```bash
npm install
npm run prisma:generate
npm run dev
```

The local site runs at:

```bash
http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env.local` and set:

```bash
DATABASE_URL="<pooled PostgreSQL connection string with sslmode=require>"
INGEST_API_TOKEN="<token>"
ADMIN_SECRET="<admin-secret>"
PUBLIC_SITE_URL="http://localhost:3000"
LOCAL_DATA_PATH="data/store.json"
LOCAL_JSON_PATH="data/sample-weekly-payload.json"
```

Wind credentials must remain only in the local Codex/Wind collection environment and must not be deployed to Vercel or any public server.

## Database

The Prisma schema includes:

- `Deal`
- `DealEvent`
- `DealSource`
- `WeeklyIssue`
- `IngestionRun`
- `ExcludedCandidate`
- `ReviewItem`
- `ManualSubmission`
- `ModerationRequest`
- `StatusChangeLog`

Generate and migrate:

```bash
npm run prisma:generate
npx prisma migrate dev --name init
```

If `DATABASE_URL` is not configured, the protected ingest API falls back to the local JSON store for development. Production should configure PostgreSQL and should not rely on local JSON persistence.

## Weekly ingest

Local JSON simulation:

```bash
npm run ingest:weekly
npm run ingest:weekly -- --from 2026-06-27 --to 2026-07-03
```

Push to the protected website API:

```bash
npm run ingest:weekly -- --push
```

Use Wind adapter entrypoint:

```bash
npm run ingest:weekly -- --source wind --from 2026-06-27 --to 2026-07-03
```

The Wind adapter is implemented as a local-only integration seam. It intentionally does not place Wind credentials in the deployed website. It still requires real validation against the local Wind MCP/CLI environment.

## Protected ingest API

Endpoint:

```bash
POST /api/internal/weekly-ingest
Authorization: Bearer $INGEST_API_TOKEN
```

The endpoint validates the JSON schema and writes idempotently by deal id, deal fingerprint, and source fingerprint.

## Feedback processing

Public submissions and correction suggestions are stored in PostgreSQL and processed by the existing Friday 22:00 automation before the normal weekly collection starts.

```bash
npm run feedback:list
npm run feedback:resolve-moderation -- --id <request-id> --decision approve --note "<evidence-based note>"
npm run feedback:resolve-submission -- --id <submission-id> --decision approved --note "<evidence-based note>" --deal-id <deal-id> --event-id <event-id>
```

The resolver is idempotent and records status changes. A manual submission may only be marked `approved` after its matched or newly ingested deal exists. Ambiguous items use `needs_manual_review` instead of being forced into a decision.

## Public announcement sources

Stored source URLs follow this order: exchange or regulator original, company investor-relations original, then a trustworthy full-announcement mirror. Search-result and announcement-list URLs are discovery aids only and are rejected as stored sources.

```bash
npm run sources:audit
npm run sources:enrich -- --mapping data/public-source-backfill-2026-07-11.json
```

When no exact public original or full-text mirror can be verified, the source remains `Wind公告库` with `link_status=not_publicly_available`; no URL is invented.

## Tests

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## Codex weekly task prompt

Schedule: every Friday at 22:00 Beijing time, equivalent to Friday 14:00 UTC.

Prompt:

```text
Run the Cross-border M&A Weekly ingest for the last successful run window through now. Use the local Wind/Codex financial data environment to search announcements, validate cross-border M&A inclusion, produce the standard weekly JSON payload, and push it to the website via POST /api/internal/weekly-ingest using INGEST_API_TOKEN. Do not expose or transmit Wind credentials. If Wind access fails, write a run report and do not claim a successful Wind collection.
```

## Validation status

The included sample JSON is simulated test data only. It is not a real Wind collection result.

## Teaser Intelligence Hub

The protected workspace is available at `/teasers`. It keeps teaser files separate from confirmed M&A transactions while allowing multiple document versions to resolve to one opportunity.

Local development account:

- username: `HTLH-IIB-Admin`
- password: configure `TEASER_ADMIN_PASSWORD` in the local `.env`

Production deliberately has no password fallback. Configure `TEASER_ADMIN_PASSWORD`, `TEASER_AUTH_SECRET`, `TEASER_SYNC_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `DASHSCOPE_API_KEY`, and `DASHSCOPE_BASE_URL` before deployment. Apply the Prisma migration before enabling uploads.

The cloud path stores original files in private Vercel Blob storage and sends a temporary copy to Alibaba Cloud Model Studio's `qwen-doc-turbo` for document parsing and structured extraction. The temporary Model Studio copy is deleted after each processing attempt. Supported inputs include PDF, scanned PDF, Word, PowerPoint, Excel, text, and common image formats.

For the Codex-assisted local workflow, place files in `TEASER_LOCAL_FOLDER`, create a reviewed `structured-manifest.json` in that folder, and push only the locally structured files:

```powershell
$env:TEASER_LOCAL_FOLDER="D:\Vibe coding for IIB\Teaser"
$env:TEASER_LOCAL_STRUCTURED_ENDPOINT="https://china-cross-border-ma-weekly.vercel.app/api/teasers/local-structured"
$env:TEASER_SYNC_TOKEN="replace-with-the-server-token"
npm run teasers:push-local
```

The manifest may contain one complete extraction per file or reference another file with `$ref` plus `overrides`. This allows English and bilingual versions of the same project to share one reviewed record and consolidate under the same project code. Cloud uploads continue to use Qwen; local Codex-assisted uploads do not call Qwen again.
