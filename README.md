# Albert's AI Song Studio

A mobile-first, independent AI song creation studio built on open-source components. The Wavecraft application foundation provides accounts, generation jobs and a personal audio library. This branch replaces the third-party music API adapter with a self-hosted ACE-Step 1.5 connector.

## Features

- Song description and style selection.
- Optional user-written lyrics, or model-generated lyrics from a description.
- Vocal-language selection and instrumental-only mode.
- Asynchronous ACE-Step generation jobs.
- MP3 playback through a same-origin audio proxy.
- Responsive, installable PWA interface for Android and desktop.

## Architecture

The Next.js app is the control plane. ACE-Step runs separately on a GPU worker. The app talks to it through the documented REST API; the browser never receives the GPU endpoint key. See docs/architecture.md.

## Open-source engine

ACE-Step 1.5 repository: https://github.com/ace-step/ACE-Step-1.5

Start with the 2B Turbo model. Check the official hardware guide against the actual GPU before provisioning. Larger XL variants need more VRAM.

## Configure

Copy .env.example to .env and set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ACESTEP_API_URL, ACESTEP_API_KEY and ACESTEP_MODEL.

ACESTEP_API_URL is the base URL of the running ACE-Step API, for example https://your-gpu-host.example. ACESTEP_API_KEY must match the key configured on the engine. Never expose the key with a NEXT_PUBLIC_ prefix.

## Run the web app

    npm install
    cp .env.example .env
    npx prisma generate
    npm run dev

The database must have the Prisma schema applied before sign-up and library features work.

## Connect the model

On a GPU machine, follow the official ACE-Step 1.5 installation guide and start its API server. The documented default API port is 8001. Make the endpoint reachable by the Next.js server over HTTPS, configure the same API key on both services, then set ACESTEP_API_URL and ACESTEP_API_KEY in the web app environment.

Useful engine checks:
- GET /health
- GET /v1/models

Generation uses:
- POST /release_task
- POST /query_result
- GET /v1/audio?path=...

## Cost and availability

The code and model are open source, but GPU inference consumes compute. Community GPU sessions can help with early experiments but are not guaranteed always-on free services. Do not advertise unlimited free generations until a sustainable GPU host and usage policy are in place.

## Deployment

Deploy the Next.js app and the ACE-Step GPU worker separately. A static hosting platform or ordinary web-service instance cannot run the large music model efficiently without a suitable GPU. Keep the engine URL configurable so the worker can move between test and production hosts without changing app code.

## Current status

The ACE-Step integration is being developed on feature/ace-step-hybrid. A live full-song test is not complete until a reachable GPU engine is configured and an actual generation is returned.
