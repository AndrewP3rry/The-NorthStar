import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE, appSessionCookieOptions, createSessionToken, uuidFromGoogleSub } from "@/lib/auth/session";

type GoogleTokenInfo = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: "true" | "false" | boolean;
  name?: string;
  picture?: string;
  error?: string;
  error_description?: string;
};

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;

export async function POST(request: Request) {
  if (!googleClientId) {
    return NextResponse.json({ ok: false, error: "Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID trên server." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { credential?: string } | null;
  const credential = body?.credential;

  if (!credential) {
    return NextResponse.json({ ok: false, error: "Thiếu Google credential." }, { status: 400 });
  }

  const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
    cache: "no-store",
  });
  const tokenInfo = (await tokenInfoResponse.json().catch(() => null)) as GoogleTokenInfo | null;

  if (!tokenInfoResponse.ok || !tokenInfo?.sub || tokenInfo.aud !== googleClientId) {
    return NextResponse.json(
      {
        ok: false,
        error: tokenInfo?.error_description ?? tokenInfo?.error ?? "Google token không hợp lệ.",
      },
      { status: 401 }
    );
  }

  if (!tokenInfo.email || tokenInfo.email_verified === false || tokenInfo.email_verified === "false") {
    return NextResponse.json({ ok: false, error: "Google account chưa xác minh email." }, { status: 401 });
  }

  const user = {
    id: uuidFromGoogleSub(tokenInfo.sub),
    email: tokenInfo.email,
    name: tokenInfo.name ?? tokenInfo.email,
    picture: tokenInfo.picture,
  };

  const response = NextResponse.json({ ok: true, user });
  response.cookies.set(APP_SESSION_COOKIE, createSessionToken(user), appSessionCookieOptions);
  return response;
}
