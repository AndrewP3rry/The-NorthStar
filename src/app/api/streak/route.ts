import { NextResponse } from "next/server";
import { getLocalStreak } from "@/lib/local-store/history";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? "guest";
  try {
    const streak = await getLocalStreak(userId);
    return NextResponse.json({ streak });
  } catch {
    return NextResponse.json({ streak: 0 });
  }
}
