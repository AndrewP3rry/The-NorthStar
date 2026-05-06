import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { supabaseAnonServer } from "@/lib/supabase/server";

type SignUpPayload = {
  email?: string;
  username?: string;
  password?: string;
};

function validateInput(email: string, username: string, password: string) {
  if (!/^\S+@\S+\.\S+$/.test(email)) return "Email không h?p l?.";
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return "Username ch? g?m ch?, s?, d?u g?ch du?i (3-24 ký t?).";
  if (!/^(?=.*[A-Z])[A-Za-z\d]{8,12}$/.test(password)) {
    return "Password ph?i 8-12 ký t?, có ít nh?t 1 ch? in hoa, không c?n ký t? d?c bi?t.";
  }
  return null;
}

export async function POST(request: Request) {
  if (!supabaseAnonServer) {
    return NextResponse.json({ ok: false, error: "Thi?u c?u hình Supabase auth." }, { status: 500 });
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
    return NextResponse.json({ ok: false, error: "Email dã t?n t?i." }, { status: 409 });
  }

  const existingUsername = await prisma.user.findFirst({
    where: { displayName: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingUsername) {
    return NextResponse.json({ ok: false, error: "Username dã t?n t?i." }, { status: 409 });
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
    message: "Ðang ký thành công. Vui lòng ki?m tra email d? xác th?c tài kho?n.",
  });
}

