import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";

/** Serve a generated file only to the owner of the track. */
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const base = (process.env.ACESTEP_API_URL || "").replace(/\\/+$/, "");
  if (!base) return NextResponse.json({ error: "Audio engine is not configured" }, { status: 503 });

  const trackId = new URL(request.url).searchParams.get("trackId");
  if (!trackId || trackId.length > 128) {
    return NextResponse.json({ error: "Invalid track ID" }, { status: 400 });
  }

  const track = await db.track.findFirst({
    where: { id: trackId, userId: session.user.id },
    select: { providerAudioPath: true },
  });
  if (!track?.providerAudioPath) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  let target;
  try {
    target = new URL(track.providerAudioPath, base);
  } catch {
    return NextResponse.json({ error: "Invalid provider audio path" }, { status: 400 });
  }

  const expected = new URL(base);
  if (target.origin !== expected.origin || target.pathname !== "/v1/audio") {
    return NextResponse.json({ error: "Provider audio path is not allowed" }, { status: 400 });
  }

  const headers = process.env.ACESTEP_API_KEY
    ? { Authorization: "Bearer " + process.env.ACESTEP_API_KEY }
    : {};

  try {
    const upstream = await fetch(target, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Audio file could not be retrieved" }, { status: upstream.status });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
        ...(upstream.headers.get("content-length")
          ? { "Content-Length": upstream.headers.get("content-length") }
          : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "Audio engine is temporarily unreachable" }, { status: 502 });
  }
}
