# Albert's AI Song Studio — Hybrid Architecture

## Product direction

An independent, mobile-first song creation studio. The web/PWA application is the control plane; an independently operated ACE-Step 1.5 service is the music-generation plane. No Suno, Udio, MusicAPI, or paid music-generation API is required.

## System layout

Android phone / desktop browser
  -> HTTPS installable PWA
  -> Next.js application
     - sign-in and user sessions
     - prompt, optional lyrics, language and style
     - generation job records and polling
     - personal track library
     - same-origin audio proxy
  -> server-to-server HTTPS with ACESTEP_API_KEY
  -> ACE-Step 1.5 API on a GPU worker
     - 2B Turbo model initially
     - optional 5Hz language model
     - asynchronous task queue
     - MP3 output
  -> GPU worker audio files
  -> authenticated app audio proxy
  -> browser player

## Components

| Layer | Choice | Reason |
|---|---|---|
| Mobile client | Next.js responsive PWA | Android Chrome support; no APK required for first release |
| Web/API | Next.js 15 route handlers | Reuses account, job and library foundation |
| Database | PostgreSQL + Prisma | Existing user and track relationships |
| Music model | ACE-Step 1.5 2B Turbo | Open model with HTTP generation API and async polling |
| Audio delivery | Same-origin Next.js proxy | Keeps GPU host and API key out of browser code |
| Audio format | MP3 initially | Practical mobile playback and downloads |
| Deployment | Web app and GPU worker separately | App can scale independently of GPU capacity |

## Generation lifecycle

1. User submits a prompt, optional lyrics, language, style and instrumental flag.
2. Next.js validates the session and request, reserves one app credit, and creates a Generation row.
3. The server adapter submits POST /release_task to ACE-Step.
4. The app stores the returned task_id and polls POST /query_result.
5. On success, the adapter parses the model result and stores playable same-origin audio proxy URLs in Track rows.
6. The user plays the MP3. The proxy only permits the configured host's /v1/audio endpoint and attaches the API key server-side.

## Required environment

- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- ACESTEP_API_URL
- ACESTEP_API_KEY (recommended; must match the model server)
- ACESTEP_MODEL (defaults to acestep-v15-turbo)

Never expose ACESTEP_API_KEY as a NEXT_PUBLIC variable.

## GPU deployment reality

The application code and model weights can be open source, but inference still needs compute. A free community GPU may help with experiments but is not a reliable production service: availability, sleep limits, quotas and queue times can change. Keep the GPU service behind the ACESTEP_API_URL contract so it can run on a community runtime during tests and move to a dedicated GPU host only when needed.

ACE-Step documentation recommends the 2B Turbo family for smaller GPU tiers. Larger XL models need substantially more VRAM. Do not promise unlimited free generation.

## Security and reliability

- Keep the GPU API private where possible; use HTTPS and a long random API key.
- Never put the GPU key in frontend JavaScript.
- The audio proxy only permits requests to the configured host's /v1/audio path, preventing an open proxy.
- Add request rate limits and per-user usage limits before public launch.
- Add a durable queue and retry policy before multiple users share one GPU.
- Persist generated files to object storage or a durable volume before using ephemeral GPU hosts in production.
- Review model and dataset licences before commercial distribution.

## Current implementation boundary

This branch connects the Next.js generation flow to the ACE-Step REST API, adds optional user lyrics and language selection, adds an audio proxy, and makes the frontend installable as a basic PWA. It does not provision a GPU machine, host model weights, or guarantee a free inference endpoint. A live end-to-end song test requires a reachable ACE-Step API configured in the deployment environment.
