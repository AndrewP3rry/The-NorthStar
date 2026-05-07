import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { appendLocalSession } from "@/lib/local-store/history";
import { readFallbackQuestions } from "@/lib/local-store/questions";
import { formatAssessmentText } from "@/lib/question-bank";
import { submitSessionSchema } from "@/lib/validation/assessment";

type QuestionLookup = {
  id: string;
  correctOption: string;
  explanation: string;
  topic: "numerical" | "verbal" | "logical" | "data_interpretation" | "visual";
};

function computeResult(
  answers: Array<{ questionId: string; selectedOption: "A" | "B" | "C" | "D" | null; timeSpentSec: number }>,
  byId: Map<string, QuestionLookup>
) {
  const scoredAnswers = answers.map((answer) => {
    const matched = byId.get(answer.questionId);
    const isCorrect = Boolean(answer.selectedOption) && matched?.correctOption === answer.selectedOption;

    return {
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      correctOption: matched?.correctOption ?? null,
      explanation: formatAssessmentText(matched?.explanation ?? "Ch\u01b0a c\u00f3 l\u1eddi gi\u1ea3i cho c\u00e2u n\u00e0y."),
      topic: matched?.topic ?? "numerical",
      timeSpentSec: answer.timeSpentSec,
      isCorrect,
    };
  });

  const correctCount = scoredAnswers.filter((item) => item.isCorrect).length;
  const wrongCount = scoredAnswers.length - correctCount;
  const score = Math.round((correctCount / Math.max(scoredAnswers.length, 1)) * 100);

  const topicBreakdown = scoredAnswers.reduce<Record<string, { total: number; correct: number }>>((acc, item) => {
    if (!acc[item.topic]) {
      acc[item.topic] = { total: 0, correct: 0 };
    }
    acc[item.topic].total += 1;
    if (item.isCorrect) {
      acc[item.topic].correct += 1;
    }
    return acc;
  }, {});

  return { scoredAnswers, correctCount, wrongCount, score, topicBreakdown };
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = submitSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payload kh\u00f4ng h\u1ee3p l\u1ec7",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { userId, answers } = parsed.data;

  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `demo-${userId}@assessment.local`,
        displayName: "Demo User",
      },
    });

    const questionIds = answers.map((answer) => answer.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctOption: true, explanation: true, topic: true },
    });

    const byId = new Map<string, QuestionLookup>(questions.map((q) => [q.id, q as QuestionLookup]));
    const result = computeResult(answers, byId);

    const session = await prisma.session.create({
      data: {
        userId,
        score: result.score,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        endedAt: new Date(),
        answers: {
          create: result.scoredAnswers.map((item) => ({
            questionId: item.questionId,
            selectedOption: item.selectedOption ?? "N/A",
            isCorrect: item.isCorrect,
            timeSpentSec: item.timeSpentSec,
          })),
        },
      },
    });

    return NextResponse.json({
      ok: true,
      persisted: true,
      sessionId: session.id,
      result: {
        total: result.scoredAnswers.length,
        score: result.score,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        topicBreakdown: result.topicBreakdown,
        answers: result.scoredAnswers,
      },
    });
  } catch {
    const fallbackById = await readFallbackQuestions();
    const result = computeResult(answers, fallbackById as Map<string, QuestionLookup>);

    const localId = randomUUID();
    const now = new Date().toISOString();
    try {
      await appendLocalSession({
        id: localId,
        userId,
        score: result.score,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        startedAt: now,
        endedAt: now,
      });
    } catch {
      // Serverless deployments may not allow writing to the project directory.
    }

    return NextResponse.json({
      ok: true,
      persisted: false,
      sessionId: localId,
      result: {
        total: result.scoredAnswers.length,
        score: result.score,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        topicBreakdown: result.topicBreakdown,
        answers: result.scoredAnswers,
      },
      note: "DB ch\u01b0a s\u1eb5n s\u00e0ng, \u0111\u00e3 ch\u1ea5m b\u1eb1ng b\u1ed9 c\u00e2u h\u1ecfi fallback.",
    });
  }
}
