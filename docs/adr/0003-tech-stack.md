# Tech stack: Next.js on Vercel, Turso, Cloudflare R2, Kinde

We use Next.js (App Router) deployed on Vercel as the full-stack framework, Turso (libSQL/distributed SQLite) as the primary database, Cloudflare R2 for object storage, and Kinde for authentication.

Next.js was chosen over a Cloudflare Workers + Hono stack for simplicity and DX — the App Router's Server Components and Server Actions reduce the client/server boundary friction, and Vercel's zero-config deployment removes operational overhead. Turso was chosen over Postgres because the data model is relational but lightweight (no joins heavier than a few tables), SQLite's per-database cost model is cheaper at low scale, and Turso's HTTP client works cleanly in Vercel's serverless runtime without connection pooling concerns. Cloudflare R2 stores Ghost Run replay payloads because it has no egress fees and is purpose-built for object storage at low cost. Kinde handles authentication to avoid building session management, social login, and JWT issuance from scratch.

The main trade-off accepted: compute (Vercel) and storage (Cloudflare R2) are on different providers, introducing minor cross-provider latency on replay file fetches. This is acceptable because replay files are only fetched once at Race start, not on every request.
