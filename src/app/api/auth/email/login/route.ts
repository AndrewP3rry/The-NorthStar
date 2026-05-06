import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE, appSessionCookieOptions, createSessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { supabaseAnonServer } from "@/lib/supabase/server";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  if (!supabaseAnonServer) {
    return NextResponse.json({ ok: false, error: "Thi?u c?u hình Supabase auth." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as LoginPayload | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Thi?u email ho?c password." }, { status: 400 });
  }

  const { data, error } = await supabaseAnonServer.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Ðang nh?p th?t b?i." }, { status: 401 });
  }

  const username = typeof data.user.user_metadata?.username === "string" ? data.user.user_metadata.username : null;
  const displayName = username && username.trim().length > 0 ? username : data.user.email ?? email;

  await prisma.user.upsert({
    where: { email: data.user.email ?? email },
    update: {
      displayName,
    },
    create: {
      id: data.user.id,
      email: data.user.email ?? email,
      displayName,
    },
  });

  const user = {
    id: data.user.id,
    email: data.user.email ?? email,
    name: displayName,
  };

  const response = NextResponse.json({ ok: true, user });
  response.cookies.set(APP_SESSION_COOKIE, createSessionToken(user), appSessionCookieOptions);
  return response;
}

