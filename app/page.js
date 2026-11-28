"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

const TAGS = ["Dreamy Pop", "Epic Orchestral", "Lo-fi Chill", "Dance / EDM", "Acoustic Folk", "Dark Synth", "Worship", "Cinematic"];

export default function CreatePage() {
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [vocalLanguage, setVocalLanguage] = useState("en");
  const [tag, setTag] = useState(TAGS[0]);
  const [instrumental, setInstrumental] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generation, setGeneration] = useState(null);
  const [error, setError] = useState(null);
  const [hapticsEnabled, setHapticsEnabled] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [activeBpm, setActiveBpm] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  // Beat-synchronised haptics are opt-in and only run while a generated track plays.
  // Web Vibration support varies by Android browser/device; audio playback still works without it.
  useEffect(() => {
    if (!hapticsEnabled || !audioPlaying || !activeBpm || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    const beatMs = 60000 / activeBpm;
    const vibrate = () => navigator.vibrate(35);
    vibrate();
    const timer = setInterval(vibrate, beatMs);
    return () => {
      clearInterval(timer);
      navigator.vibrate(0);
    };
  }, [hapticsEnabled, audioPlaying, activeBpm]);

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
        body: JSON.stringify({ prompt, lyrics, vocalLanguage, styleTags: [tag], instrumental }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Generation failed to start");
      setGeneration(data.generation);

      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch("/api/generations/" + data.generation.id, { cache: "no-store" });
          const d = await r.json();
          if (!r.ok) return;
          setGeneration(d.generation);
          if (d.generation.status === "complete" || d.generation.status === "failed") {
            clearInterval(pollRef.current);
            setSubmitting(false);
          }
        } catch {
          // Keep polling through temporary network interruptions.
        }
      }, 5000);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-5 sm:pt-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">ALBERT'S AI SONG STUDIO</p>
      <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
        Your idea.<br />Your lyrics.<br />Your song.
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Create original vocal songs or instrumentals. Your brief is sent to the connected open-source music engine and returned as playable audio.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <label htmlFor="prompt" className="font-mono text-[11px] uppercase tracking-wider text-muted">
          Song idea and sound
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="A hopeful cinematic worship anthem, warm piano, soaring strings, modern drums, intimate verse and powerful chorus..."
          className="mt-2 w-full resize-y rounded-lg border border-line bg-ink p-3 text-sm outline-none focus-visible:border-amber"
        />

        <div className="mt-5">
          <label htmlFor="lyrics" className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Lyrics (optional)
          </label>
          <textarea
            id="lyrics"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={6}
            maxLength={4096}
            disabled={instrumental}
            placeholder={"[Verse 1]\nWrite your lyrics here...\n\n[Chorus]\n..."}
            className="mt-2 w-full resize-y rounded-lg border border-line bg-ink p-3 text-sm outline-none focus-visible:border-amber disabled:opacity-40"
          />
          <p className="mt-1 text-xs text-muted">
            Leave blank for model-written lyrics (requires the ACE-Step language model), or add your own. User-written lyrics and instrumentals can run without the language model.
          </p>
        </div>

        <div className="mt-5">
          <label htmlFor="language" className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Vocal language
          </label>
          <select
            id="language"
            value={vocalLanguage}
            onChange={(e) => setVocalLanguage(e.target.value)}
            disabled={instrumental}
            className="mt-2 w-full rounded-lg border border-line bg-ink p-3 text-sm disabled:opacity-40"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="mr">Marathi</option>
            <option value="es">Spanish</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
          </select>
          <p className="mt-1 text-xs text-muted">Language output depends on the model's multilingual support. Test each language before publishing.</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={tag === t
                ? "rounded-full border border-teal bg-teal/15 px-3 py-1.5 text-xs font-medium text-teal"
                : "rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted hover:border-teal/40"}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
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
            className="w-full rounded-full bg-magenta px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {submitting ? "Creating your song…" : status === "authenticated" ? "Generate song" : "Sign in to generate"}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg border border-magenta/40 bg-magenta/10 p-3 text-sm text-magenta">{error}</p>}

      {generation && (
        <div className="mt-6 rounded-xl border border-line bg-panel p-4">
          <p className="font-mono text-xs text-muted">
            Job {generation.id.slice(0, 8)} — status: <span className="text-teal">{generation.status}</span>
          </p>
          {generation.lyrics && <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-teal">View submitted lyrics</summary><pre className="mt-2 whitespace-pre-wrap text-sm text-muted">{generation.lyrics}</pre></details>}
          {generation.status === "failed" && (
            <p className="mt-2 text-sm text-magenta">{generation.errorMessage || "Generation failed."}</p>
          )}
          {generation.tracks?.length > 0 && (
            <div className="mt-4 space-y-3">
              {generation.tracks.map((track) => (
                <div key={track.id} className="rounded-lg border border-line p-3">
                  <p className="text-sm font-semibold">{track.title}</p>
                  <p className="mt-1 text-xs text-muted">{[track.bpm ? track.bpm + " BPM" : null, track.keyScale || null, track.durationSecs ? Math.floor(track.durationSecs / 60) + ":" + String(track.durationSecs % 60).padStart(2, "0") : null].filter(Boolean).join(" · ")}</p>
                  {track.lyrics && <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-teal">View generated lyrics</summary><pre className="mt-2 whitespace-pre-wrap text-sm text-muted">{track.lyrics}</pre></details>}
                  {track.audioUrl ? (
                    <>
                      <audio
                        controls
                        preload="none"
                        src={track.audioUrl}
                        className="mt-2 w-full"
                        onPlay={() => { setActiveBpm(Number(track.bpm) || 0); setAudioPlaying(true); }}
                        onPause={() => setAudioPlaying(false)}
                        onEnded={() => setAudioPlaying(false)}
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs text-muted">
                          <input
                            type="checkbox"
                            checked={hapticsEnabled}
                            onChange={(event) => setHapticsEnabled(event.target.checked)}
                            disabled={!track.bpm}
                            className="h-4 w-4 accent-amber"
                          />
                          Beat vibration {track.bpm ? `(${track.bpm} BPM)` : "(BPM unavailable)"}
                        </label>
                        <a href={track.audioUrl} download className="text-xs font-semibold text-teal underline">Download MP3</a>
                      </div>
                      {hapticsEnabled && !track.bpm && <p className="mt-2 text-xs text-muted">Beat vibration needs BPM metadata from the music engine.</p>}
                    </>
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
