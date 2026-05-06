import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE, appSessionCookieOptions, createSessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { supabaseAnonServer } from "@/lib/supabase/server";

type VerifyPayload = {
  email?: string;
  password?: string;
  username?: string;
  code?: string;
  rememberMe?: boolean;
};

export async function POST(request: Request) {
  if (!supabaseAnonServer) {
    return NextResponse.json({ ok: false, error: "Thiếu cấu hình Supabase auth." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as VerifyPayload | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  const username = body?.username?.trim() ?? "";
  const code = body?.code?.trim() ?? "";
  const rememberMe = body?.rememberMe !== false;

  if (!email || !password || !code) {
    return NextResponse.json({ ok: false, error: "Thiếu email, password hoặc mã xác thực." }, { status: 400 });
  }

  const { error: verifyError } = await supabaseAnonServer.auth.verifyOtp({
    email,
    token: code,
    type: "signup",
  });

  if (verifyError) {
    return NextResponse.json({ ok: false, error: `Mã xác thực không hợp lệ: ${verifyError.message}` }, { status: 400 });
  }

  const { data, error: signInError } = await supabaseAnonServer.auth.signInWithPassword({ email, password });

  if (signInError || !data.user) {
    return NextResponse.json({ ok: false, error: signInError?.message ?? "Đăng nhập tự động thất bại." }, { status: 401 });
  }

  const displayName =
    username ||
    (typeof data.user.user_metadata?.username === "string" ? data.user.user_metadata.username : "") ||
    data.user.email ||
    email;

  try {
    await prisma.user.upsert({
      where: { email: data.user.email ?? email },
      update: { displayName },
      create: {
        id: data.user.id,
        email: data.user.email ?? email,
        displayName,
      },
    });
  } catch {
    // best-effort sync
  }

  const user = {
    id: data.user.id,
    email: data.user.email ?? email,
    name: displayName,
  };

  const ttl = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const response = NextResponse.json({ ok: true, user });
  response.cookies.set(APP_SESSION_COOKIE, createSessionToken(user, ttl), appSessionCookieOptions(rememberMe));
  return response;
}
