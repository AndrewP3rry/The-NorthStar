import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE, appSessionCookieOptions, createSessionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type ProfilePatch = {
  name?: string;
  avatarUrl?: string;
};

const MAX_AVATAR_LENGTH = 300_000;

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập." }, { status: 401 });
  }

  try {
    const profile = await prisma.user.findUnique({
      where: { email: currentUser.email },
      select: { id: true, email: true, displayName: true, avatarUrl: true, createdAt: true },
    });

    if (profile) {
      return NextResponse.json({
        ok: true,
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.displayName ?? currentUser.name,
          picture: profile.avatarUrl ?? currentUser.picture,
          createdAt: profile.createdAt,
        },
      });
    }
  } catch {
    // Cookie fallback keeps the profile page usable when the database is not ready.
  }

  return NextResponse.json({ ok: true, user: currentUser });
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ProfilePatch | null;
  const name = body?.name?.trim() || currentUser.name;
  const avatarUrl = body?.avatarUrl?.trim() || undefined;

  if (name.length < 2 || name.length > 40) {
    return NextResponse.json({ ok: false, error: "Tên hiển thị cần từ 2-40 ký tự." }, { status: 400 });
  }

  if (avatarUrl && avatarUrl.length > MAX_AVATAR_LENGTH) {
    return NextResponse.json({ ok: false, error: "Avatar quá lớn. Vui lòng chọn ảnh nhỏ hơn." }, { status: 400 });
  }

  const nextUser = {
    id: currentUser.id,
    email: currentUser.email,
    name,
    picture: avatarUrl ?? currentUser.picture,
  };

  try {
    const saved = await prisma.user.upsert({
      where: { email: currentUser.email },
      update: { displayName: name, avatarUrl: nextUser.picture },
      create: {
        id: currentUser.id,
        email: currentUser.email,
        displayName: name,
        avatarUrl: nextUser.picture,
      },
      select: { id: true, email: true, displayName: true, avatarUrl: true },
    });

    nextUser.id = saved.id;
    nextUser.name = saved.displayName ?? name;
    nextUser.picture = saved.avatarUrl ?? undefined;
  } catch {
    // Still refresh the signed cookie so uploaded presets work locally without DB.
  }

  const response = NextResponse.json({ ok: true, user: nextUser });
  response.cookies.set(APP_SESSION_COOKIE, createSessionToken(nextUser), appSessionCookieOptions(true));
  return response;
}
