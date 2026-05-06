import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { supabaseAnonServer } from "@/lib/supabase/server";

type SignUpPayload = {
  email?: string;
  username?: string;
  password?: string;
};

function validateInput(email: string, username: string, password: string) {
  if (!/^\S+@\S+\.\S+$/.test(email)) return "Email không hợp lệ.";
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return "Username chỉ gồm chữ, số, dấu gạch dưới (3-24 ký tự).";
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/.test(password)) {
    return "Password phải 8-12 ký tự, bao gồm chữ hoa, chữ thường và số.";
  }
  return null;
}

export async function POST(request: Request) {
  if (!supabaseAnonServer) {
    return NextResponse.json({ ok: false, error: "Thiếu cấu hình Supabase auth." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as SignUpPayload | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const username = body?.username?.trim() ?? "";
  const password = body?.password ?? "";

  const validationError = validateInput(email, username, password);
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ ok: false, error: "Email đã tồn tại." }, { status: 409 });
  }

  const existingUsername = await prisma.user.findFirst({
    where: { displayName: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingUsername) {
    return NextResponse.json({ ok: false, error: "Username đã tồn tại." }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  const { error } = await supabaseAnonServer.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/`,
      data: {
        username,
      },
    },
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    requiresVerification: true,
    message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
  });
}

