# Wavecraft

Production Next.js app for text-to-song generation: auth, Postgres-backed
users/credits/library, and a real job pipeline (submit → poll → persisted
audio URL) against a third-party AI music generation API.

## Deploy to Vercel (one click, after you push this to GitHub)

1. Push this folder to a new GitHub repo (`git init && git add . && git commit -m "init" && gh repo create`, or use GitHub's web uploader).
2. Replace `YOUR_GITHUB_USERNAME/wavecraft` in the button URL below with your actual repo path, then click it (or paste the URL into a browser):

   `https://vercel.com/new/clone?repository-url=https://github.com/YOUR_GITHUB_USERNAME/wavecraft&env=NEXTAUTH_SECRET,MUSIC_API_BASE_URL,MUSIC_API_KEY&envDescription=See%20README%20%23setup%20for%20where%20to%20get%20each%20value&project-name=wavecraft&repository-name=wavecraft`

   As a Markdown badge for your repo's own README:
   ```md
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_GITHUB_USERNAME/wavecraft&env=NEXTAUTH_SECRET,MUSIC_API_BASE_URL,MUSIC_API_KEY&project-name=wavecraft&repository-name=wavecraft)
   ```
3. Vercel will ask for `NEXTAUTH_SECRET` (run `openssl rand -base64 32` locally), `MUSIC_API_BASE_URL`, and `MUSIC_API_KEY` (from your chosen provider) during import.
4. Before or right after the first deploy: in the Vercel project, go to **Storage → Marketplace Database Providers → Neon** (Vercel's own Postgres offering was retired in favor of this) and install it — it auto-injects a working `DATABASE_URL` for you, no copy-pasting a connection string required.
5. Once `DATABASE_URL` is set, open the project's **Deployments** tab and redeploy, or run `npx prisma migrate deploy` via `vercel env pull && npx prisma migrate deploy` locally against the new database — the schema needs to exist before signup/login will work.
6. `NEXTAUTH_URL` — set this to your `*.vercel.app` domain (or custom domain) in Project Settings → Environment Variables; Vercel doesn't infer it automatically for you.

After that, every `git push` to `main` auto-deploys — that's the "one click" part going forward.

## What's real here vs. what you must supply

- **Real**: auth (NextAuth + hashed passwords), Postgres schema (Prisma),
  credit accounting with transactional rollback on failure, a generation
  job model with async status polling, and a library that plays back
  actual `audio` elements from stored URLs.
- **You must supply**: an account with a licensed music-generation API
  (there is no public Suno API). `lib/musicProvider.js` is the single file
  that talks to that vendor — it's written against the common
  `musicapi.ai` / `aimusicapi.org`-style REST shape. If you sign up with a
  different vendor, open their docs and adjust the field names in that one
  file; nothing else needs to change.

No AI model runs inside this app — generation happens on the provider's
infrastructure. Building and hosting your own audio-generation model is a
separate, much larger project (GPU training infra, licensed training data,
months of work), not something any codebase handed to you can shortcut.

## Setup

```bash
npm install
cp .env.example .env       # fill in DATABASE_URL, NEXTAUTH_SECRET, MUSIC_API_*
npx prisma migrate dev --name init
npm run dev
```

## Deploy

1. Provision Postgres (Neon, Supabase, RDS, Railway, etc.) and set `DATABASE_URL`.
2. Set `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and `NEXTAUTH_URL` to your domain.
3. Sign up with a music-gen provider, set `MUSIC_API_BASE_URL` / `MUSIC_API_KEY`.
4. `npm run build && npm run start`, or deploy to Vercel/Render/Fly with those env vars set.
5. Run `npx prisma migrate deploy` against production `DATABASE_URL` before first boot.

## Structure

```
app/
  page.js                 Create page (prompt -> submit -> poll -> playable result)
  library/page.js         Signed-in user's saved tracks
  login/, signup/         Credentials auth
  api/generate            Starts a generation job, deducts a credit, calls the provider
  api/generations/[id]    Polls provider status, persists tracks on completion
  api/tracks              Lists a user's library
  api/auth/[...nextauth]  NextAuth handler
  api/signup              Account creation
lib/
  db.js                   Prisma client singleton
  auth.js                 NextAuth config
  musicProvider.js        <- the only file to edit when you change vendors
prisma/schema.prisma      User / Generation / Track models
```

## Extending toward full Suno-parity

Not included, but straightforward to add on this foundation:
- Stripe billing to sell credits (swap the flat `credits` field for a ledger)
- Public/community feed (`Track.isPublic` is already in the schema)
- Webhooks instead of polling, if your provider supports them
- S3/R2 re-hosting of provider audio URLs so playback doesn't depend on their CDN uptime
