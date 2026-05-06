"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Compass, LogIn, User } from "lucide-react";

type Language = "vi" | "en";
type AuthMode = "signin" | "signup";
type AppUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (options: { client_id: string; ux_mode: "redirect"; login_uri: string }) => void;
      renderButton: (element: HTMLElement, options: Record<string, string | number | boolean>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

const LANGUAGE_KEY = "northstar-language";

const readLanguage = (): Language => {
  if (typeof window === "undefined") return "vi";
  return window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "vi";
};

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Không t?i du?c Google Sign-In.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không t?i du?c Google Sign-In."));
    document.head.appendChild(script);
  });
}

export function Navbar() {
  const pathname = usePathname();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [language, setLanguage] = useState<Language>("vi");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPracticeRoute = pathname?.startsWith("/practice");
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { user: AppUser | null }) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!showAuthModal || !googleButtonRef.current) return;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;
        if (!googleClientId) {
          setAuthError("Thi?u NEXT_PUBLIC_GOOGLE_CLIENT_ID trên Vercel.");
          return;
        }

        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          ux_mode: "redirect",
          login_uri: `${window.location.origin}/api/auth/google`,
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "signin_with",
          shape: "pill",
          logo_alignment: "left",
          width: 260,
        });
      })
      .catch((error: Error) => setAuthError(error.message));

    return () => {
      cancelled = true;
    };
  }, [googleClientId, showAuthModal]);

  const toggleLanguage = () => {
    const next: Language = language === "vi" ? "en" : "vi";
    window.localStorage.setItem(LANGUAGE_KEY, next);
    setLanguage(next);
    window.dispatchEvent(new CustomEvent<Language>("northstar-language-change", { detail: next }));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.dispatchEvent(new CustomEvent("northstar-auth-change", { detail: null }));
  };

  const resetAuthState = () => {
    setAuthError(null);
    setAuthMessage(null);
  };

  const handleEmailAuth = async () => {
    resetAuthState();
    setSubmitting(true);
    try {
      const endpoint = authMode === "signup" ? "/api/auth/email/signup" : "/api/auth/email/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; message?: string; user?: AppUser } | null;

      if (!response.ok || !data?.ok) {
        setAuthError(data?.error ?? (language === "vi" ? "Xác th?c th?t b?i." : "Authentication failed."));
        return;
      }

      if (authMode === "signup") {
        setAuthMessage(data.message ?? (language === "vi" ? "Vui lòng ki?m tra email d? xác th?c tài kho?n." : "Please verify your email."));
        return;
      }

      if (data.user) {
        setUser(data.user);
      }
      setShowAuthModal(false);
      window.dispatchEvent(new CustomEvent("northstar-auth-change", { detail: data.user ?? null }));
    } catch {
      setAuthError(language === "vi" ? "Không th? k?t n?i d?n máy ch?." : "Could not connect to server.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isPracticeRoute) return null;

  return (
    <>
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
              aria-label={language === "vi" ? "Switch to English" : "Chuy?n sang ti?ng Vi?t"}
              className="rounded-full border-[2px] border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              {language === "vi" ? "EN" : "VI"}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 overflow-hidden rounded-full border-[2px] border-black bg-brand-peach">
                  {user.picture ? (
                    <Image src={user.picture} alt="Avatar" width={28} height={28} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User size={14} />
                    </div>
                  )}
                </div>
                <button onClick={handleLogout} className="text-xs font-bold text-slate-500 transition-colors hover:text-red-500">
                  {language === "vi" ? "Ðang xu?t" : "Sign Out"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  resetAuthState();
                }}
                className="flex items-center gap-1.5 rounded-full border-[2px] border-black bg-brand-primary px-4 py-1.5 text-xs font-extrabold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
              >
                <LogIn size={14} />
                {language === "vi" ? "Ðang Nh?p" : "Sign In"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuthModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
          <section className="hand-drawn-card w-full max-w-sm bg-white p-7 text-center">
            <h2 className="text-2xl font-black text-black">{language === "vi" ? "Tài Kho?n" : "Account"}</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  resetAuthState();
                }}
                className={`rounded-full border-[2px] border-black px-3 py-2 text-sm font-extrabold ${authMode === "signin" ? "bg-brand-primary text-white" : "bg-white text-black"}`}
              >
                {language === "vi" ? "Ðang nh?p" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  resetAuthState();
                }}
                className={`rounded-full border-[2px] border-black px-3 py-2 text-sm font-extrabold ${authMode === "signup" ? "bg-brand-primary text-white" : "bg-white text-black"}`}
              >
                {language === "vi" ? "Ðang ký" : "Sign up"}
              </button>
            </div>

            <div className="mt-4 space-y-2 text-left">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="w-full rounded-2xl border-[2px] border-black px-3 py-2 text-sm outline-none"
              />
              {authMode === "signup" && (
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username"
                  className="w-full rounded-2xl border-[2px] border-black px-3 py-2 text-sm outline-none"
                />
              )}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border-[2px] border-black px-3 py-2 text-sm outline-none"
              />
              {authMode === "signup" && (
                <p className="text-xs text-slate-500">{language === "vi" ? "Password: 8-12 ký t?, có ít nh?t 1 ch? in hoa." : "Password: 8-12 chars, at least 1 uppercase letter."}</p>
              )}
              <button
                type="button"
                onClick={handleEmailAuth}
                disabled={submitting}
                className="w-full rounded-full border-[2px] border-black bg-brand-primary px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
              >
                {submitting
                  ? language === "vi"
                    ? "Ðang x? lý..."
                    : "Working..."
                  : authMode === "signup"
                    ? language === "vi"
                      ? "T?o tài kho?n"
                      : "Create account"
                    : language === "vi"
                      ? "Ðang nh?p"
                      : "Sign in"}
              </button>
            </div>

            <p className="my-4 text-xs font-bold text-slate-400">{language === "vi" ? "ho?c" : "or"}</p>
            <div className="flex justify-center" ref={googleButtonRef} />

            {authError && <p className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">{authError}</p>}
            {authMessage && <p className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{authMessage}</p>}

            <button type="button" onClick={() => setShowAuthModal(false)} className="mt-5 text-sm font-bold text-slate-500 hover:text-black">
              {language === "vi" ? "Ðóng" : "Close"}
            </button>
          </section>
        </div>
      )}
    </>
  );
}

