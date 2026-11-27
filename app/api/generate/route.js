import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { requestGeneration } from "../../../lib/musicProvider";

const schema = z.object({
  prompt: z.string().min(3).max(500),
  styleTags: z.array(z.string()).min(1).max(5),
  instrumental: z.boolean().default(false),
  lyrics: z.string().max(6000).optional().default(""),
  vocalLanguage: z.string().max(12).optional().default("en"),
});

const CREDIT_COST = 1;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.credits < CREDIT_COST) {
    return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
  }

  const { prompt, styleTags, instrumental, lyrics, vocalLanguage } = parsed.data;
  const generation = await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { credits: { decrement: CREDIT_COST } },
    });
    return tx.generation.create({
      data: { userId: user.id, prompt, styleTags, instrumental, lyrics, vocalLanguage, status: "pending" },
    });
  });

  try {
    const providerJobId = await requestGeneration({ prompt, styleTags, instrumental, lyrics, vocalLanguage });
    const updated = await db.generation.update({
      where: { id: generation.id },
      data: { status: "processing", providerJobId },
    });
    return NextResponse.json({ generation: updated }, { status: 202 });
  } catch (err) {
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { credits: { increment: CREDIT_COST } } }),
      db.generation.update({
        where: { id: generation.id },
        data: { status: "failed", errorMessage: String(err.message || err) },
      }),
    ]);
    return NextResponse.json(
      { error: "Failed to start generation", detail: String(err.message || err) },
      { status: 502 }
    );
  }
}
