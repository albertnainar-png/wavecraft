"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

const TAGS = ["Dreamy Pop", "Epic Orchestral", "Lo-fi Chill", "Dance / EDM", "Acoustic Folk", "Dark Synth"];

export default function CreatePage() {
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState("");
  const [tag, setTag] = useState(TAGS[0]);
  const [instrumental, setInstrumental] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generation, setGeneration] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  async function handleGenerate() {
    if (!prompt.trim() || submitting) return;
    setError(null);

    if (status !== "authenticated") {
      signIn();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, styleTags: [tag], instrumental }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed to start");
      setGeneration(data.generation);

      pollRef.current = setInterval(async () => {
        const r = await fetch(`/api/generations/${data.generation.id}`);
        const d = await r.json();
        if (!r.ok) return;
        setGeneration(d.generation);
        if (d.generation.status === "complete" || d.generation.status === "failed") {
          clearInterval(pollRef.current);
          setSubmitting(false);
        }
      }, 4000);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">Wavecraft</p>
      <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
        Describe a song.
        <br />
        Get a real track back.
      </h1>
      <p className="mt-3 max-w-lg text-muted">
        Requests go to your configured music-generation provider and return actual generated audio —
        typically in 30–90 seconds.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-panel p-5">
        <label htmlFor="prompt" className="font-mono text-[11px] uppercase tracking-wider text-muted">
          Song description
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. driving home at 2am, city lights blurring, bittersweet and hopeful"
          className="mt-2 w-full resize-none rounded-lg border border-line bg-ink p-3 text-sm outline-none focus-visible:border-amber"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                tag === t ? "border-teal bg-teal/15 text-teal" : "border-line text-muted hover:border-teal/40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={instrumental}
              onChange={(e) => setInstrumental(e.target.checked)}
              className="h-4 w-4 accent-amber"
            />
            Instrumental only
          </label>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || submitting}
            className="rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Generating…" : status === "authenticated" ? "Generate song" : "Sign in to generate"}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg border border-magenta/40 bg-magenta/10 p-3 text-sm text-magenta">{error}</p>}

      {generation && (
        <div className="mt-6 rounded-xl border border-line bg-panel p-4">
          <p className="font-mono text-xs text-muted">
            Job {generation.id.slice(0, 8)} — status: <span className="text-teal">{generation.status}</span>
          </p>

          {generation.status === "failed" && (
            <p className="mt-2 text-sm text-magenta">{generation.errorMessage || "Generation failed."}</p>
          )}

          {generation.tracks?.length > 0 && (
            <div className="mt-4 space-y-3">
              {generation.tracks.map((t) => (
                <div key={t.id} className="rounded-lg border border-line p-3">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.audioUrl ? (
                    <audio controls src={t.audioUrl} className="mt-2 w-full" />
                  ) : (
                    <p className="mt-2 text-xs text-muted">Audio not yet available.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
