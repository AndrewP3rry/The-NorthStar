import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE, appSessionCookieOptions, createSessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { supabaseAnonServer } from "@/lib/supabase/server";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (
    process.env.NODE_ENV === "production" &&
    (supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1"))
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Cấu hình Supabase trên production đang sai (URL đang trỏ localhost).",
      },
      { status: 500 }
    );
  }

  if (!supabaseAnonServer) {
    return NextResponse.json({ ok: false, error: "Thiếu cấu hình Supabase auth." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as LoginPayload | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Thiếu email hoặc password." }, { status: 400 });
  }

  const { data, error } = await supabaseAnonServer.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("fetch failed")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Không kết nối được đến Supabase từ server deploy. Vui lòng kiểm tra lại NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trên Vercel.",
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: false, error: error?.message ?? "Đăng nhập thất bại." }, { status: 401 });
  }

  const username = typeof data.user.user_metadata?.username === "string" ? data.user.user_metadata.username : null;
  const displayName = username && username.trim().length > 0 ? username : data.user.email ?? email;

  try {
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
  } catch {
    // Prisma sync phụ thất bại không được chặn đăng nhập thật.
  }

  const user = {
    id: data.user.id,
    email: data.user.email ?? email,
    name: displayName,
  };

  const response = NextResponse.json({ ok: true, user });
  response.cookies.set(APP_SESSION_COOKIE, createSessionToken(user), appSessionCookieOptions);
  return response;
}

