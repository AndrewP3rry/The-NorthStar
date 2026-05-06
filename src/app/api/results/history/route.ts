import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { readLocalHistory } from "@/lib/local-store/history";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Thiếu userId" }, { status: 400 });
  }

  try {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 10,
      select: {
        id: true,
        score: true,
        correctCount: true,
        wrongCount: true,
        startedAt: true,
        endedAt: true,
      },
    });

    return NextResponse.json({ ok: true, source: "database", sessions });
  } catch {
    try {
      const store = await readLocalHistory();
      const sessions = store.sessions
        .filter((session) => session.userId === userId)
        .slice(0, 10)
        .map((session) => ({
          id: session.id,
          score: session.score,
          correctCount: session.correctCount,
          wrongCount: session.wrongCount,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
        }));

      return NextResponse.json({ ok: true, source: "local-file", sessions });
    } catch {
      return NextResponse.json({ ok: true, source: "empty-fallback", sessions: [] });
    }
  }
}
