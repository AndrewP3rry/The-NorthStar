"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { Compass, LogIn, User } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type Language = "vi" | "en";

const LANGUAGE_KEY = "northstar-language";

const readLanguage = (): Language => {
  if (typeof window === "undefined") return "vi";
  return window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "vi";
};

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [language, setLanguage] = useState<Language>("vi");

  const isPracticeRoute = pathname?.startsWith("/practice");

  useEffect(() => {
    const syncLanguage = window.setTimeout(() => setLanguage(readLanguage()), 0);

    const onLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<Language>).detail;
      setLanguage(next === "en" ? "en" : "vi");
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_KEY) setLanguage(readLanguage());
    };

    window.addEventListener("northstar-language-change", onLanguageChange as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearTimeout(syncLanguage);
      window.removeEventListener("northstar-language-change", onLanguageChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;

    sb.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleLanguage = () => {
    const next: Language = language === "vi" ? "en" : "vi";
    window.localStorage.setItem(LANGUAGE_KEY, next);
    setLanguage(next);
    window.dispatchEvent(new CustomEvent<Language>("northstar-language-change", { detail: next }));
  };

  const handleLogin = async () => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      window.alert("Chưa cấu hình Supabase Google Sign-in. Vui lòng bổ sung NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleLogout = async () => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    await sb.auth.signOut();
  };

  if (isPracticeRoute) return null;

  return (
    <nav className="sticky top-0 z-50 px-4 pb-2 pt-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between rounded-full border-[2px] border-black bg-white/80 px-5 py-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-black bg-brand-primary text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Compass size={18} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-black tracking-tight text-black">
            The <span style={{ color: "var(--primary)" }}>NorthStar</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={language === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}
            className="rounded-full border-[2px] border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            {language === "vi" ? "EN" : "VI"}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 overflow-hidden rounded-full border-[2px] border-black bg-brand-peach">
                {user.user_metadata.avatar_url ? (
                  <Image src={user.user_metadata.avatar_url} alt="Avatar" width={28} height={28} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User size={14} />
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="text-xs font-bold text-slate-500 transition-colors hover:text-red-500">
                {language === "vi" ? "Đăng xuất" : "Sign Out"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-1.5 rounded-full border-[2px] border-black bg-brand-primary px-4 py-1.5 text-xs font-extrabold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
            >
              <LogIn size={14} />
              {language === "vi" ? "Đăng Nhập" : "Sign In"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
