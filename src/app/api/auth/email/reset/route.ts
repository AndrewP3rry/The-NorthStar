import { NextResponse } from "next/server";
import { supabaseAnonServer } from "@/lib/supabase/server";

type ResetPayload = {
  email?: string;
};

export async function POST(request: Request) {
  if (!supabaseAnonServer) {
    return NextResponse.json({ ok: false, error: "Thiếu cấu hình Supabase auth." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as ResetPayload | null;
  const email = body?.email?.trim().toLowerCase() ?? "";

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Email không hợp lệ." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const { error } = await supabaseAnonServer.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/`,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: `Không gửi được email reset: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư." });
}
