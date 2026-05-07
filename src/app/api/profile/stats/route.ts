import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const TOPICS = ["numerical", "verbal", "logical", "data_interpretation", "visual"] as const;
const LABELS: Record<(typeof TOPICS)[number], string> = {
  numerical: "Numerical",
  verbal: "Verbal",
  logical: "Logical",
  data_interpretation: "Data",
  visual: "Visual",
};

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const sessions = await prisma.session.findMany({
      where: { userId: currentUser.id },
      orderBy: { startedAt: "desc" },
      take: 30,
      select: {
        id: true,
        score: true,
        correctCount: true,
        wrongCount: true,
        startedAt: true,
        answers: {
          select: {
            isCorrect: true,
            question: { select: { topic: true } },
          },
        },
      },
    });

    const topicStats = TOPICS.map((topic) => {
      const answers = sessions.flatMap((session) => session.answers).filter((answer) => answer.question.topic === topic);
      const correct = answers.filter((answer) => answer.isCorrect).length;
      const total = answers.length;
      return {
        topic,
        label: LABELS[topic],
        score: total > 0 ? Math.round((correct / total) * 100) : 0,
        correct,
        total,
      };
    });

    const totalSessions = sessions.length;
    const averageScore = totalSessions > 0 ? Math.round(sessions.reduce((sum, session) => sum + session.score, 0) / totalSessions) : 0;
    const totalCorrect = sessions.reduce((sum, session) => sum + session.correctCount, 0);
    const totalWrong = sessions.reduce((sum, session) => sum + session.wrongCount, 0);
    const strongest = [...topicStats].sort((a, b) => b.score - a.score)[0] ?? topicStats[0];
    const weakest = [...topicStats].filter((item) => item.total > 0).sort((a, b) => a.score - b.score)[0] ?? topicStats[0];

    return NextResponse.json({
      ok: true,
      summary: { totalSessions, averageScore, totalCorrect, totalWrong, strongest, weakest },
      topicStats,
      recentSessions: sessions.slice(0, 8).map((session) => ({
        id: session.id,
        score: session.score,
        correctCount: session.correctCount,
        wrongCount: session.wrongCount,
        startedAt: session.startedAt,
      })),
    });
  } catch {
    const topicStats = TOPICS.map((topic) => ({ topic, label: LABELS[topic], score: 0, correct: 0, total: 0 }));
    return NextResponse.json({
      ok: true,
      summary: { totalSessions: 0, averageScore: 0, totalCorrect: 0, totalWrong: 0, strongest: topicStats[0], weakest: topicStats[0] },
      topicStats,
      recentSessions: [],
    });
  }
}
