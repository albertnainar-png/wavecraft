import { NextResponse } from "next/server";

/** Same-origin audio proxy; keeps the GPU host and API key server-side. */
export async function GET(request) {
  const base = (process.env.ACESTEP_API_URL || "").replace(/\/+$/, "");
  if (!base) return NextResponse.json({ error: "Audio engine is not configured" }, { status: 503 });

  const rawPath = new URL(request.url).searchParams.get("path");
  if (!rawPath || rawPath.length > 2048) {
    return NextResponse.json({ error: "Invalid audio path" }, { status: 400 });
  }

  let target;
  try {
    target = new URL(rawPath, base);
  } catch {
    return NextResponse.json({ error: "Invalid audio path" }, { status: 400 });
  }

  const expected = new URL(base);
  if (target.origin !== expected.origin || target.pathname !== "/v1/audio") {
    return NextResponse.json({ error: "Audio path is not allowed" }, { status: 400 });
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
