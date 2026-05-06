import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { fallbackQuestionBatch, mapBankQuestion, type Topic } from "@/lib/question-bank";

function hashInt(input: string) {
  return Number.parseInt(createHash("sha256").update(input).digest("hex").slice(0, 12), 16);
}

function shuffle<T>(arr: T[], seed: string) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = hashInt(`${seed}-${i}`) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") as Topic | null;
  const limit = parseInt(searchParams.get("limit") ?? "15");
  const random = searchParams.get("random") === "true";

  if (!fallbackQuestionBatch.questions.length) {
    return NextResponse.json({ error: "Question bank not found" }, { status: 404 });
  }

  let pool = fallbackQuestionBatch.questions;
  if (topic) {
    pool = pool.filter((q) => q.topic === topic);
  }

  if (pool.length === 0) {
    return NextResponse.json({ questions: [] });
  }

  let selected = pool;
  if (random) {
    const seed = `${Date.now()}-${Math.random()}`;
    selected = shuffle(pool, seed);
  }

  const questions = selected.slice(0, limit).map(mapBankQuestion);

  return NextResponse.json({
    questions,
    totalInPool: pool.length,
    topic: topic ?? "mixed",
  });
}
