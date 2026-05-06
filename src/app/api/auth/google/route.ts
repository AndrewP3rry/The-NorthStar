import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE, appSessionCookieOptions, createSessionToken, uuidFromGoogleSub } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

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

type AppUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;

async function readCredential(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { credential?: string } | null;
    return body?.credential ?? null;
  }

  const form = await request.formData().catch(() => null);
  return form?.get("credential")?.toString() ?? null;
}

function finishAuth(request: Request, user: AppUser) {
  const acceptsJson = request.headers.get("accept")?.includes("application/json");
  const response = acceptsJson ? NextResponse.json({ ok: true, user }) : NextResponse.redirect(new URL("/", request.url));

  response.cookies.set(APP_SESSION_COOKIE, createSessionToken(user), appSessionCookieOptions(true));
  return response;
}

export async function POST(request: Request) {
  if (!googleClientId) {
    return NextResponse.json({ ok: false, error: "Thi?u NEXT_PUBLIC_GOOGLE_CLIENT_ID trên server." }, { status: 500 });
  }

  const credential = await readCredential(request);

  if (!credential) {
    return NextResponse.json({ ok: false, error: "Thi?u Google credential." }, { status: 400 });
  }

  const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
    cache: "no-store",
  });
  const tokenInfo = (await tokenInfoResponse.json().catch(() => null)) as GoogleTokenInfo | null;

  if (!tokenInfoResponse.ok || !tokenInfo?.sub || tokenInfo.aud !== googleClientId) {
    return NextResponse.json(
      {
        ok: false,
        error: tokenInfo?.error_description ?? tokenInfo?.error ?? "Google token không h?p l?.",
      },
      { status: 401 }
    );
  }

  if (!tokenInfo.email || tokenInfo.email_verified === false || tokenInfo.email_verified === "false") {
    return NextResponse.json({ ok: false, error: "Google account chua xác minh email." }, { status: 401 });
  }

  const user = {
    id: uuidFromGoogleSub(tokenInfo.sub),
    email: tokenInfo.email,
    name: tokenInfo.name ?? tokenInfo.email,
    picture: tokenInfo.picture,
  };

  await prisma.user.upsert({
    where: { email: user.email },
    update: {
      displayName: user.name,
    },
    create: {
      id: user.id,
      email: user.email,
      displayName: user.name,
    },
  });

  return finishAuth(request, user);
}

