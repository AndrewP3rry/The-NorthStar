"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Compass, Flame, ArrowRight, BookOpen, BarChart2, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";

type Language = "vi" | "en";
type CopyKey = keyof typeof COPY.vi;

type Topic = {
  labelKey: "numerical" | "verbal" | "logical" | "dataInterpretation";
  emoji: string;
  color: string;
  href: string;
};

type Stat = {
  icon: ReactNode;
  value: string;
  labelKey: "questions" | "topics" | "free";
};

type AppUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

const LANGUAGE_KEY = "northstar-language";

const COPY = {
  vi: {
    heroDescription: "Luyện tập hằng ngày với bộ đề thông minh tự điều chỉnh theo level của bạn. Mỗi ngày 25 câu, đủ để bứt phá trong 30 ngày.",
    startPractice: "Bắt đầu luyện tập",
    questions: "Câu hỏi",
    topics: "Chủ đề",
    free: "Miễn phí",
    dailyCheckIn: "Daily Check-in",
    greeting: "Xin chào",
    activeStreak: "ngày liên tiếp. Giữ nhịp luyện tập hôm nay nhé.",
    emptyStreak: "Hôm nay là một điểm xuất phát đẹp. Làm một bài ngắn để mở streak nào.",
    checkInToday: "Check-in hôm nay",
    chooseTopic: "Chọn chủ đề luyện tập",
    numerical: "Tư duy Số",
    verbal: "Tư duy Ngôn ngữ",
    logical: "Tư duy Logic",
    dataInterpretation: "Phân tích Dữ liệu",
    dailyPractice: "Luyện Tập Hàng Ngày",
    startNow: "Làm bài ngay →",
    readyTitle: "Sẵn sàng làm bài chưa?",
    readyBody: "Khi bắt đầu, bạn sẽ vào chế độ làm bài tập trung. Bạn chỉ quay lại màn hình chính sau khi nộp bài và xem kết quả.",
    cancel: "Chưa, để sau",
    begin: "Bắt đầu",
    you: "bạn",
  },
  en: {
    heroDescription: "Practice every day with a smart question set that adapts to your level. 25 questions a day, enough momentum to improve in 30 days.",
    startPractice: "Start Practice",
    questions: "Questions",
    topics: "Topics",
    free: "Free",
    dailyCheckIn: "Daily Check-in",
    greeting: "Hello",
    activeStreak: "day streak. Keep the rhythm going today.",
    emptyStreak: "Today is a clean starting point. Take one short practice to open your streak.",
    checkInToday: "Check in today",
    chooseTopic: "Choose a practice topic",
    numerical: "Numerical Reasoning",
    verbal: "Verbal Reasoning",
    logical: "Logical Reasoning",
    dataInterpretation: "Data Interpretation",
    dailyPractice: "Daily Practice",
    startNow: "Start now →",
    readyTitle: "Ready to start?",
    readyBody: "Once you begin, you will enter focused practice mode. You can return to the homepage after submitting and reviewing your results.",
    cancel: "Not yet",
    begin: "Begin",
    you: "you",
  },
} as const;

const TOPICS: Topic[] = [
  { labelKey: "numerical", emoji: "🔢", color: "bg-brand-secondary", href: "/practice?topic=numerical" },
  { labelKey: "verbal", emoji: "📝", color: "bg-brand-accent", href: "/practice?topic=verbal" },
  { labelKey: "logical", emoji: "🧩", color: "bg-brand-peach", href: "/practice?topic=logical" },
  { labelKey: "dataInterpretation", emoji: "📊", color: "bg-brand-secondary", href: "/practice?topic=data_interpretation" },
];

const STATS: Stat[] = [
  { icon: <BookOpen size={20} />, value: "500+", labelKey: "questions" },
  { icon: <BarChart2 size={20} />, value: "5", labelKey: "topics" },
  { icon: <Star size={20} />, value: "100%", labelKey: "free" },
];

const readLanguage = (): Language => {
  if (typeof window === "undefined") return "vi";
  return window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "vi";
};

export default function HomePage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("vi");
  const [user, setUser] = useState<AppUser | null>(null);
  const [streak, setStreak] = useState(0);
  const [pendingPracticeHref, setPendingPracticeHref] = useState<string | null>(null);

  const t = COPY[language];

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

    const onAuthChange = (event: Event) => {
      setUser(((event as CustomEvent<AppUser | null>).detail ?? null) as AppUser | null);
    };

    window.addEventListener("northstar-auth-change", onAuthChange as EventListener);
    return () => window.removeEventListener("northstar-auth-change", onAuthChange as EventListener);
  }, []);

  useEffect(() => {
    if (!user) return;

    fetch(`/api/streak?userId=${user.id}`)
      .then((r) => r.json())
      .then(({ streak }) => setStreak(streak))
      .catch(() => {});
  }, [user]);

  const openPracticeConfirm = (href: string) => {
    setPendingPracticeHref(href);
  };

  const startPractice = () => {
    if (!pendingPracticeHref) return;
    router.push(pendingPracticeHref);
  };

  const displayName = user?.name ?? user?.email ?? t.you;

  return (
    <main className="min-h-screen px-4 pb-20 pt-2">
      <div className="mx-auto max-w-4xl">
        <section className="hand-drawn-card relative isolate mb-6 overflow-hidden p-8 md:p-12">
          <div className="pointer-events-none absolute -right-10 -top-10 z-0 h-48 w-48 rounded-full border-[3px] border-dashed border-black/10 bg-brand-peach/30" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 z-0 h-32 w-32 rounded-full border-[3px] border-dashed border-black/10 bg-brand-secondary/25" />

          <div className="relative z-10 mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-[2.5px] border-black bg-brand-primary text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Compass size={22} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black text-black">
                The <span style={{ color: "var(--primary)" }}>NorthStar</span>
              </span>
            </div>

            {user && streak > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border-[2px] border-black bg-brand-peach px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Flame size={16} className="text-orange-500" fill="currentColor" />
                <span className="text-sm font-extrabold text-black">
                  {streak} {language === "vi" ? "ngày" : "days"} 🔥
                </span>
              </div>
            )}
          </div>

          <h1 className="relative z-10 text-3xl font-black leading-tight text-black md:text-5xl">
            Online <br />
            <span className="relative inline-block" style={{ color: "var(--primary)" }}>
              Aptitude Test
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6 Q50 2 100 5 Q150 8 198 3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
            </span>
          </h1>
          <p className="relative z-10 mt-4 max-w-xl text-base text-slate-600 md:text-lg">{t.heroDescription}</p>

          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => openPracticeConfirm("/practice")} className="hand-drawn-button hand-drawn-button-primary text-base">
              <Sparkles size={18} />
              {t.startPractice}
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="relative z-10 mt-10 flex flex-wrap gap-4">
            {STATS.map((s) => (
              <div key={s.labelKey} className="flex items-center gap-2 rounded-full border-[2px] border-black/10 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
                <span className="text-brand-primary drop-shadow-sm">{s.icon}</span>
                <span className="text-lg font-black text-black">{s.value}</span>
                <span className="text-sm font-semibold text-slate-800">{t[s.labelKey as CopyKey]}</span>
              </div>
            ))}
          </div>
        </section>

        {user && (
          <section className="mb-6 rounded-[1.5rem] border-[3px] border-black bg-brand-peach p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-black bg-white text-3xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  🔥
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.dailyCheckIn}</p>
                  <p className="text-2xl font-black text-black">{t.greeting}, {displayName}</p>
                  <p className="text-sm text-slate-600">
                    {streak > 0 ? `${streak} ${t.activeStreak}` : t.emptyStreak}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => openPracticeConfirm("/practice")} className="hand-drawn-button hand-drawn-button-primary justify-center text-sm">
                {t.checkInToday}
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="mt-4 flex gap-1.5">
              {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-black bg-orange-400 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  ✓
                </div>
              ))}
              {Array.from({ length: Math.max(7 - Math.min(streak, 7), 0) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8 w-8 rounded-full border-[2px] border-dashed border-black/30 bg-white/50" />
              ))}
            </div>
          </section>
        )}

        <section className="mb-6">
          <h2 className="mb-4 text-lg font-black text-black">{t.chooseTopic}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {TOPICS.map((topic) => (
              <button
                type="button"
                key={topic.labelKey}
                onClick={() => openPracticeConfirm(topic.href)}
                className={`group flex flex-col items-center gap-3 rounded-[1.5rem] border-[3px] border-black ${topic.color} p-5 text-center shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
              >
                <span className="text-3xl">{topic.emoji}</span>
                <span className="text-sm font-extrabold leading-tight text-black">{t[topic.labelKey as CopyKey]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border-[3px] border-black bg-brand-primary p-8 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">{t.dailyPractice}</h2>
            </div>
            <button
              type="button"
              onClick={() => openPracticeConfirm("/practice")}
              className="flex-shrink-0 rounded-full border-[2.5px] border-white bg-white px-6 py-3 text-sm font-extrabold text-brand-primary shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              {t.startNow}
            </button>
          </div>
        </section>
      </div>

      {pendingPracticeHref && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
          <section className="hand-drawn-card w-full max-w-md bg-white p-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-black bg-brand-secondary text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              ✦
            </div>
            <h2 className="text-2xl font-black text-black">{t.readyTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t.readyBody}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setPendingPracticeHref(null)} className="hand-drawn-button hand-drawn-button-secondary flex-1 justify-center text-sm">
                {t.cancel}
              </button>
              <button type="button" onClick={startPractice} className="hand-drawn-button hand-drawn-button-primary flex-1 justify-center text-sm">
                {t.begin}
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
