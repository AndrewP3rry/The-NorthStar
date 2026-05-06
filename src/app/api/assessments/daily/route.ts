import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { mockDailyQuestions } from "@/lib/db/mock-data";
import { getLocalStreak } from "@/lib/local-store/history";

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

function desiredByStreak(streak: number): Record<Difficulty, number> {
  if (streak <= 2) return { easy: 3, medium: 2, hard: 0 };
  if (streak <= 6) return { easy: 2, medium: 2, hard: 1 };
  return { easy: 1, medium: 2, hard: 2 };
}

function pickByDifficulty(pool: LocalQuestion[], streak: number, seed: string) {
  const need = desiredByStreak(streak);
  const picked: LocalQuestion[] = [];

  (Object.keys(need) as Difficulty[]).forEach((d) => {
    const candidates = shuffle(pool.filter((q) => q.difficulty === d), `${seed}-${d}`);
    picked.push(...candidates.slice(0, need[d]));
  });

  if (picked.length < 5) {
    const remaining = shuffle(pool.filter((q) => !picked.find((p) => p.id === q.id)), `${seed}-fill`);
    picked.push(...remaining.slice(0, 5 - picked.length));
  }

  return picked.slice(0, 5);
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
  const userId = searchParams.get("userId") ?? "550e8400-e29b-41d4-a716-446655440000";

  const local = await readLocalBatch();
  if (local) {
    const streak = await getLocalStreak(userId);
    const topics: Topic[] = ["numerical", "verbal", "data_interpretation", "logical", "visual"];
    const byTopic = topics.flatMap((topic) => {
      const pool = local.questions.filter((q) => q.topic === topic);
      return pickByDifficulty(pool, streak, `${local.batchId}-${userId}-${topic}`);
    });

    const finalQuestions = shuffle(byTopic, `${local.batchId}-${userId}-final`).slice(0, 25).map(mapQuestion);

    return NextResponse.json({
      source: "pipeline-file",
      batchId: local.batchId,
      targetCount: 25,
      streak,
      difficultyProfile: desiredByStreak(streak),
      questions: finalQuestions,
    });
  }

  try {
    const batch = await prisma.questionBatch.findFirst({
      where: { status: "published", language: "vi" },
      orderBy: { publishedAt: "desc" },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
          include: { question: true },
        },
      },
    });

    if (!batch || batch.questions.length === 0) {
      return NextResponse.json({ source: "mock", batchId: "draft-local-batch", targetCount: 25, questions: mockDailyQuestions });
    }

    const questions = batch.questions.slice(0, 25).map((item) => ({
      id: item.question.id,
      topic: item.question.topic,
      difficulty: item.question.difficulty,
      stem: item.question.stem,
      options: [
        { key: "A", text: item.question.optionA },
        { key: "B", text: item.question.optionB },
        { key: "C", text: item.question.optionC },
        { key: "D", text: item.question.optionD },
      ],
      estimatedTimeSec: item.question.estimatedTimeSec,
      questionType: "text",
      imageSvg: null,
    }));

    return NextResponse.json({ source: "database", batchId: batch.id, targetCount: 25, questions });
  } catch {
    return NextResponse.json({ source: "mock-fallback", batchId: "draft-local-batch", targetCount: 25, questions: mockDailyQuestions });
  }
}
