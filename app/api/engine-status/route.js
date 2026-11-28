import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = (process.env.ACESTEP_API_URL || "").replace(/\\/+$/, "");
  const model = process.env.ACESTEP_MODEL || "acestep-v15-turbo";

  if (!base) {
    return NextResponse.json({ configured: false, reachable: false, model, message: "GPU engine URL is not configured." });
  }

  try {
    const response = await fetch(base + "/health", {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: process.env.ACESTEP_API_KEY
        ? { Authorization: "Bearer " + process.env.ACESTEP_API_KEY }
        : {},
    });
    return NextResponse.json({
      configured: true,
      reachable: response.ok,
      model,
      message: response.ok ? "Music engine is reachable." : "Music engine responded but health check failed.",
    });
  } catch {
    return NextResponse.json({
      configured: true,
      reachable: false,
      model,
      message: "Music engine is not reachable right now.",
    });
  }
}
