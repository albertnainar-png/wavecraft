import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { checkGenerationStatus } from "../../../../lib/musicProvider";

export async function GET(_req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const generation = await db.generation.findUnique({
    where: { id: params.id },
    include: { tracks: true },
  });

  if (!generation || generation.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Already resolved locally — no need to hit the provider again.
  if (generation.status === "complete" || generation.status === "failed") {
    return NextResponse.json({ generation });
  }

  if (!generation.providerJobId) {
    return NextResponse.json({ generation });
  }

  const result = await checkGenerationStatus(generation.providerJobId);

  if (result.status === "complete" && generation.tracks.length === 0) {
    const updated = await db.$transaction(async (tx) => {
      await tx.track.createMany({
        data: result.tracks.map((t, i) => ({
          userId: generation.userId,
          generationId: generation.id,
          title: t.title || `${generation.prompt.slice(0, 40)} (${i + 1})`,
          audioUrl: t.audioUrl,
          coverUrl: t.coverUrl,
          durationSecs: t.durationSecs,
          tagKey: generation.styleTags[0] || null,
        })),
      });
      return tx.generation.update({
        where: { id: generation.id },
        data: { status: "complete" },
        include: { tracks: true },
      });
    });
    return NextResponse.json({ generation: updated });
  }

  if (result.status === "failed") {
    const updated = await db.generation.update({
      where: { id: generation.id },
      data: { status: "failed", errorMessage: result.errorMessage },
      include: { tracks: true },
    });
    return NextResponse.json({ generation: updated });
  }

  return NextResponse.json({ generation });
}
