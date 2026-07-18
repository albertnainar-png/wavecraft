"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function LibraryPage() {
  const { status } = useSession();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/tracks")
      .then((r) => r.json())
      .then((d) => setTracks(d.tracks || []))
      .finally(() => setLoading(false));
  }, [status]);

  if (status !== "authenticated") {
    return <main className="mx-auto max-w-3xl px-5 py-14 text-muted">Sign in to see your library.</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-10">
      <h2 className="text-2xl font-bold">Your library</h2>
      {loading ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : tracks.length === 0 ? (
        <p className="mt-6 text-muted">No tracks yet — generate one from the Create page.</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {tracks.map((t) => (
            <div key={t.id} className="rounded-xl border border-line bg-panel p-4">
              <p className="font-semibold">{t.title}</p>
              {t.audioUrl && <audio controls src={t.audioUrl} className="mt-2 w-full" />}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
