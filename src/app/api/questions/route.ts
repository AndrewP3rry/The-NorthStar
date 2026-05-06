import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

type Topic = "numerical" | "verbal" | "logical" | "data_interpretation" | "visual";
type Difficulty = "easy" | "medium" | "hard";

type LocalQuestion = {
  id: string;
  topic: Topic;
  difficulty: Difficulty;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  estimatedTimeSec: number;
  questionType?: "text" | "image";
  imageSvg?: string | null;
  patternId?: string;
};

type LocalBatch = {
  batchId: string;
  questions: LocalQuestion[];
};

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

function mapQuestion(q: LocalQuestion) {
  return {
    id: q.id,
    topic: q.topic,
    difficulty: q.difficulty,
    stem: q.stem,
    options: [
      { key: "A", text: q.optionA },
      { key: "B", text: q.optionB },
      { key: "C", text: q.optionC },
      { key: "D", text: q.optionD },
    ],
    estimatedTimeSec: q.estimatedTimeSec,
    questionType: q.questionType ?? "text",
    imageSvg: q.imageSvg ?? null,
    patternId: q.patternId,
  };
}

async function readLocalBatch() {
  try {
    const filePath = path.join(process.cwd(), ".tmp", "pipeline", "published_batch.json");
    return JSON.parse(await readFile(filePath, "utf8")) as LocalBatch;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") as Topic | null;
  const limit = parseInt(searchParams.get("limit") ?? "15");
  const random = searchParams.get("random") === "true";

  const local = await readLocalBatch();
  if (!local) {
    return NextResponse.json({ error: "Question bank not found" }, { status: 404 });
  }

  let pool = local.questions;
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

  const questions = selected.slice(0, limit).map(mapQuestion);

  return NextResponse.json({
    questions,
    totalInPool: pool.length,
    topic: topic ?? "mixed",
  });
}
