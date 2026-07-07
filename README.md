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
