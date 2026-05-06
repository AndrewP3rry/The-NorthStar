import { NextRequest, NextResponse } from "next/server";
import { APP_SESSION_COOKIE, appSessionCookieOptions, createSessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { supabaseAnonServer, supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  if (tokenHash && type && supabaseAnonServer) {
    const { data, error } = await supabaseAnonServer.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "recovery" | "invite" | "email_change" | "magiclink" | "email",
    });

    if (!error && data.user?.email) {
      const username =
        typeof data.user.user_metadata?.username === "string" && data.user.user_metadata.username.trim().length > 0
          ? data.user.user_metadata.username.trim()
          : null;

      try {
        await prisma.user.upsert({
          where: { email: data.user.email },
          update: {
            displayName: username ?? data.user.email,
          },
          create: {
            id: data.user.id,
            email: data.user.email,
            displayName: username ?? data.user.email,
          },
        });
      } catch {
        // Prisma sync phụ thất bại không chặn verify + auto login.
      }

      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set(
        APP_SESSION_COOKIE,
        createSessionToken({
          id: data.user.id,
          email: data.user.email,
          name: username ?? data.user.email,
        }),
        appSessionCookieOptions
      );
      return response;
    }

    return NextResponse.redirect(`${origin}${next}?auth=verify_failed`);
  }

  if (code && supabaseServer) {
    await supabaseServer.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

