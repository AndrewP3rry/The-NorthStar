import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { mockDailyQuestions } from "@/lib/db/mock-data";
import { getLocalStreak } from "@/lib/local-store/history";
import { fallbackQuestionBatch, mapBankQuestion, type BankQuestion, type Difficulty, type Topic } from "@/lib/question-bank";

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

function pickByDifficulty(pool: BankQuestion[], streak: number, seed: string) {
  const need = desiredByStreak(streak);
  const picked: BankQuestion[] = [];

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? "550e8400-e29b-41d4-a716-446655440000";

  if (fallbackQuestionBatch.questions.length > 0) {
    let streak = 0;
    try {
      streak = await getLocalStreak(userId);
    } catch {
      streak = 0;
    }
    const topics: Topic[] = ["numerical", "verbal", "data_interpretation", "logical", "visual"];
    const byTopic = topics.flatMap((topic) => {
      const pool = fallbackQuestionBatch.questions.filter((q) => q.topic === topic);
      return pickByDifficulty(pool, streak, `${fallbackQuestionBatch.batchId}-${userId}-${topic}`);
    });

    const finalQuestions = shuffle(byTopic, `${fallbackQuestionBatch.batchId}-${userId}-final`).slice(0, 25).map(mapBankQuestion);

    return NextResponse.json({
      source: "bundled-bank",
      batchId: fallbackQuestionBatch.batchId,
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
