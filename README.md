# Albert's AI Song Studio

A mobile-first, independent AI song creation studio built on open-source components. The Wavecraft application foundation provides accounts, generation jobs and a personal audio library. This branch replaces the third-party music API adapter with a self-hosted ACE-Step 1.5 connector.

## Features

- Song description and style selection.
- Optional user-written lyrics, or model-generated lyrics from a description when the ACE-Step language model is enabled.
- Vocal-language selection and instrumental-only mode.
- Asynchronous ACE-Step generation jobs.
- MP3 playback through a same-origin audio proxy.
- Responsive, installable PWA interface for Android and desktop.

## Architecture

The Next.js app is the control plane. ACE-Step runs separately on a GPU worker. The app talks to it through the documented REST API; the browser never receives the GPU endpoint key. See docs/architecture.md.

## Open-source engine

ACE-Step 1.5 repository: https://github.com/ace-step/ACE-Step-1.5

Start with the 2B Turbo model. For a low-VRAM 2B setup, user-written lyrics and instrumentals can run without the language model. Description-only auto-lyrics use ACE-Step's language model, so install a compatible 5Hz LM; current guidance recommends the 0.6B LM in the 6–8GB VRAM tier. Check the official hardware guide against the actual GPU before provisioning. Larger XL variants need more VRAM.

## Configure

Copy .env.example to .env and set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ACESTEP_API_URL, ACESTEP_API_KEY and ACESTEP_MODEL.

ACESTEP_API_URL is the base URL of the running ACE-Step API, for example https://your-gpu-host.example. ACESTEP_API_KEY must match the key configured on the engine. Never expose the key with a NEXT_PUBLIC_ prefix.

## Run the web app

    npm install
    cp .env.example .env
    npx prisma generate
    npm run dev

The repository includes an initial PostgreSQL migration and a follow-up migration for lyrics and track metadata. Apply them with `npx prisma migrate deploy` before sign-up and library features work.

## Connect the model

On a GPU machine, follow the official ACE-Step 1.5 installation guide:

    git clone https://github.com/ACE-Step/ACE-Step-1.5.git
    cd ACE-Step-1.5
    uv sync

For a DiT-only 2B Turbo worker (no auto-generated lyrics):

    export SERVER_NAME=0.0.0.0
    export PORT=8001
    export ACESTEP_CONFIG_PATH=acestep-v15-turbo
    export ACESTEP_INIT_LLM=false
    export ACESTEP_API_KEY="use-a-long-random-secret"
    uv run acestep-api

For description-only auto-lyrics, use a compatible 5Hz LM instead of disabling it. The official guide recommends the 0.6B LM in the 6–8GB VRAM tier:

    export ACESTEP_INIT_LLM=true
    export ACESTEP_LM_MODEL_PATH=acestep-5Hz-lm-0.6B
    export ACESTEP_LM_BACKEND=pt

Make the endpoint reachable by the Next.js server over HTTPS, configure the same API key on both services, then set ACESTEP_API_URL and ACESTEP_API_KEY in the web app environment. Do not expose the API server directly to the public internet without authentication and TLS.

Useful engine checks:
- GET /health
- GET /v1/models

Generation uses:
- POST /release_task
- POST /query_result
- GET /v1/audio?path=...

## Cost and availability

The code and model are open source, but GPU inference consumes compute. Community GPU sessions can help with early experiments but are not guaranteed always-on free services. Do not advertise unlimited free generations until a sustainable GPU host and usage policy are in place.

## Android-only GPU setup

You can operate the studio from an Android phone; the phone does not run the music model. Use the temporary Colab GPU worker notebook:

[Open Albert's AI Song Studio GPU notebook in Google Colab](https://colab.research.google.com/github/albertnainar-png/wavecraft/blob/feature/ace-step-hybrid/gpu/Albert_AI_Song_Studio_Colab.ipynb)

1. Open the notebook in Chrome on Android and sign in to Google.
2. In Colab, select Runtime → Change runtime type → T4 GPU if one is offered. Availability is controlled by Google and is not guaranteed on free accounts.
3. Run the cells from top to bottom. Keep the Colab session open while generating songs.
4. Privately copy the printed HTTPS engine URL and API key.
5. Set these server-side environment variables on the deployed Next.js app: `ACESTEP_API_URL` (the HTTPS tunnel URL) and `ACESTEP_API_KEY` (the generated key). Never use a `NEXT_PUBLIC_` prefix for the key and never commit either value to GitHub.
6. Reload the studio and check the engine status indicator.

The notebook uses a temporary Cloudflare Quick Tunnel for development. Its URL changes between sessions, and the Colab runtime can disconnect or expire. This is a test arrangement, not permanent hosting. Do not share the tunnel URL and API key together.

## Deployment

Deploy the Next.js app and the ACE-Step GPU worker separately. A static hosting platform or ordinary web-service instance cannot run the large music model efficiently without a suitable GPU. Keep the engine URL configurable so the worker can move between test and production hosts without changing app code.

## Current status

The ACE-Step integration is being developed on feature/ace-step-hybrid. A live full-song test is not complete until a reachable GPU engine is configured and an actual generation is returned.


## Android APK

The Android package uses Capacitor as a native Android shell around the hosted Next.js application. This keeps authentication, the personal library, generation APIs and audio delivery on the server while giving Android users an installable app.

**A deployed HTTPS app URL is required before an APK can be built.** The APK does not contain the Next.js server or the GPU music model.

To build a test APK without a laptop:
1. Deploy the Next.js app and configure its database and server-side secrets.
2. Open the repository's **Actions → Build Android APK → Run workflow** page.
3. Enter the deployed HTTPS app URL and run the workflow.
4. Download the generated APK from the workflow run's Artifacts section.

The workflow creates the Android project, syncs the hosted app URL into the WebView wrapper, builds a debug APK and uploads it as an artifact. The first APK is for private testing; a signed release build and Play Store preparation are separate steps. Do not put ACE-Step API keys in the APK.
