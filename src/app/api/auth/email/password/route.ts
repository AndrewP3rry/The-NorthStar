import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";

type PasswordPayload = {
  password?: string;
};

function validatePassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/.test(password);
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập." }, { status: 401 });
  }

  if (!supabaseServer) {
    return NextResponse.json({ ok: false, error: "Thiếu SUPABASE_SERVICE_ROLE_KEY để đổi mật khẩu." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as PasswordPayload | null;
  const password = body?.password ?? "";

  if (!validatePassword(password)) {
    return NextResponse.json({ ok: false, error: "Password phải 8-12 ký tự, gồm chữ hoa, chữ thường và số." }, { status: 400 });
  }

  const { error } = await supabaseServer.auth.admin.updateUserById(currentUser.id, { password });

  if (error) {
    return NextResponse.json({ ok: false, error: `Đổi mật khẩu thất bại: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Đã đổi mật khẩu thành công." });
}
