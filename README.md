# EduVault

Responsive legal-education library frontend. It indexes official and open-license resources, never mirrors third-party copyrighted files.

## Local run
`npm install` then `npm run dev`

## Production integrations
- Auth: Auth.js or Clerk with RBAC (`learner`, `contributor`, `reviewer`, `admin`)
- Data: PostgreSQL schema in `db/schema.sql`; use Meilisearch/Elasticsearch for faceted search
- Files: private Cloudflare R2/S3 bucket, signed downloads only after license verification
- Jobs: queue virus scan, OCR, license review, AI moderation, and takedown SLA alerts
- AI: call server-side OpenAI endpoints only; never expose API keys to the client
