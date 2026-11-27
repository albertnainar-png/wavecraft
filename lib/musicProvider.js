/**
 * Adapter for a self-hosted ACE-Step 1.5 REST API.
 * Keep the GPU endpoint and key on the server, never in browser code.
 */
const BASE_URL = (process.env.ACESTEP_API_URL || "").replace(/\/+$/, "");
const API_KEY = process.env.ACESTEP_API_KEY || "";
const MODEL = process.env.ACESTEP_MODEL || "acestep-v15-turbo";

function assertConfigured() {
  if (!BASE_URL) throw new Error("ACE-Step is not connected. Set ACESTEP_API_URL.");
}
function headers() {
  return {
    "Content-Type": "application/json",
    ...(API_KEY ? { Authorization: "Bearer " + API_KEY } : {}),
  };
}
async function readApiResponse(response, label) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || (payload.code && payload.code !== 200) || payload.error) {
    throw new Error(payload.error || payload.detail || label + " failed (" + response.status + ")");
  }
  return payload.data;
}

export async function requestGeneration({ prompt, styleTags = [], instrumental = false, lyrics = "", vocalLanguage = "en" }) {
  assertConfigured();
  const stylePrompt = [prompt, ...styleTags].filter(Boolean).join(", ");
  const body = {
    prompt: stylePrompt,
    lyrics: instrumental ? "" : lyrics,
    vocal_language: vocalLanguage || "en",
    instrumental,
    thinking: true,
    audio_format: "mp3",
    model: MODEL,
    batch_size: 2,
    inference_steps: 8,
    ...(!instrumental && !lyrics.trim() ? { sample_query: stylePrompt } : {}),
  };
  const response = await fetch(BASE_URL + "/release_task", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await readApiResponse(response, "ACE-Step task submission");
  if (!data || !data.task_id) throw new Error("ACE-Step did not return a task_id.");
  return data.task_id;
}

export async function checkGenerationStatus(providerJobId) {
  assertConfigured();
  const response = await fetch(BASE_URL + "/query_result", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ task_id_list: [providerJobId] }),
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  const data = await readApiResponse(response, "ACE-Step status query");
  const task = Array.isArray(data) ? data[0] : data;
  if (!task) return { status: "processing", tracks: [] };
  if (Number(task.status) === 2) {
    return { status: "failed", tracks: [], errorMessage: task.error || "ACE-Step generation failed." };
  }
  if (Number(task.status) !== 1) return { status: "processing", tracks: [] };

  let outputs = [];
  try {
    outputs = typeof task.result === "string" ? JSON.parse(task.result) : (task.result || []);
  } catch {
    throw new Error("ACE-Step returned an unreadable result payload.");
  }
  const tracks = (Array.isArray(outputs) ? outputs : [outputs])
    .filter((item) => item && Number(item.status ?? 1) === 1 && item.file)
    .map((item, index) => ({
      title: item.prompt ? "AI Song — " + String(item.prompt).slice(0, 42) : "AI Song " + (index + 1),
      audioUrl: "/api/audio?path=" + encodeURIComponent(item.file),
      coverUrl: null,
      durationSecs: Math.round(Number(item.metas?.duration || 0)),
    }));
  if (!tracks.length) {
    return { status: "failed", tracks: [], errorMessage: "ACE-Step returned no playable audio files." };
  }
  return { status: "complete", tracks };
}
