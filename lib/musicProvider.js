/**
 * Adapter for a third-party AI music generation API.
 *
 * There is no public Suno API. To actually generate audio in production you
 * need an account with a licensed provider, e.g.:
 *   - https://musicapi.ai
 *   - https://aimusicapi.org
 *   - https://www.mubert.com (royalty-free / catalog-based, different model)
 *
 * Field names below (prompt, tags, make_instrumental, task_id, audio_url)
 * match the common shape used by musicapi.ai / aimusicapi.org-style REST
 * APIs. If you sign up with a different vendor, check their docs and adjust
 * requestGeneration()/checkGenerationStatus() to match their exact schema —
 * this is the ONLY place that needs to change.
 *
 * Required env vars:
 *   MUSIC_API_BASE_URL   e.g. https://api.musicapi.ai/v1
 *   MUSIC_API_KEY        your provider API key
 */

const BASE_URL = process.env.MUSIC_API_BASE_URL;
const API_KEY = process.env.MUSIC_API_KEY;

function assertConfigured() {
  if (!BASE_URL || !API_KEY) {
    throw new Error(
      "Music provider not configured. Set MUSIC_API_BASE_URL and MUSIC_API_KEY in your environment " +
        "to a real provider account before calling this in production."
    );
  }
}

/** Kicks off a generation job. Returns the provider's job id. */
export async function requestGeneration({ prompt, styleTags, instrumental }) {
  assertConfigured();

  const res = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      tags: styleTags.join(", "),
      make_instrumental: instrumental,
      // most providers return 2 variants per request, matching Suno's UX
      number_of_songs: 2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Provider rejected generation request (${res.status}): ${detail}`);
  }

  const data = await res.json();
  // Expected: { task_id: "..." } — adjust to your provider's actual response.
  return data.task_id;
}

/** Polls job status. Returns { status, tracks } where tracks is [] until complete. */
export async function checkGenerationStatus(providerJobId) {
  assertConfigured();

  const res = await fetch(`${BASE_URL}/status/${providerJobId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to check generation status (${res.status})`);
  }

  const data = await res.json();

  // Normalize provider status vocab to ours.
  const statusMap = { pending: "processing", running: "processing", succeeded: "complete", failed: "failed" };
  const status = statusMap[data.status] || "processing";

  const tracks =
    status === "complete"
      ? (data.songs || []).map((s) => ({
          title: s.title,
          audioUrl: s.audio_url,
          coverUrl: s.image_url,
          durationSecs: Math.round(s.duration || 0),
        }))
      : [];

  return { status, tracks, errorMessage: data.error || null };
}
