"use client";

import { useEffect, useState } from "react";
import { Compass, Flame, ArrowRight, BookOpen, BarChart2, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

const TOPICS = [
  { label: "Tư duy Số", emoji: "🔢", color: "bg-brand-secondary", href: "/practice?topic=numerical" },
  { label: "Tư duy Ngôn ngữ", emoji: "📝", color: "bg-brand-accent", href: "/practice?topic=verbal" },
  { label: "Tư duy Logic", emoji: "🧩", color: "bg-brand-peach", href: "/practice?topic=logical" },
  { label: "Phân tích Dữ liệu", emoji: "📊", color: "bg-brand-secondary", href: "/practice?topic=data_interpretation" },
];

const STATS = [
  { icon: <BookOpen size={20} />, value: "500+", label: "Câu hỏi" },
  { icon: <BarChart2 size={20} />, value: "5", label: "Chủ đề" },
  { icon: <Star size={20} />, value: "100%", label: "Miễn phí" },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [streak, setStreak] = useState(0);
  const [pendingPracticeHref, setPendingPracticeHref] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;

    sb.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

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

  const displayName = user?.user_metadata.full_name ?? user?.email ?? "bạn";

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
                <span className="text-sm font-extrabold text-black">{streak} ngày 🔥</span>
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
          <p className="relative z-10 mt-4 max-w-xl text-base text-slate-600 md:text-lg">
            Luyện tập hằng ngày với bộ đề thông minh tự điều chỉnh theo level của bạn. Mỗi ngày 25 câu, đủ để bứt phá trong 30 ngày.
          </p>

          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => openPracticeConfirm("/practice")} className="hand-drawn-button hand-drawn-button-primary text-base">
              <Sparkles size={18} />
              Bắt đầu luyện tập
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="relative z-10 mt-10 flex flex-wrap gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-full border-[2px] border-black/10 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
                <span className="text-brand-primary drop-shadow-sm">{s.icon}</span>
                <span className="text-lg font-black text-black">{s.value}</span>
                <span className="text-sm font-semibold text-slate-700">{s.label}</span>
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
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Daily Check-in</p>
                  <p className="text-2xl font-black text-black">Xin chào, {displayName}</p>
                  <p className="text-sm text-slate-600">
                    {streak > 0 ? `${streak} ngày liên tiếp. Giữ nhịp luyện tập hôm nay nhé.` : "Hôm nay là một điểm xuất phát đẹp. Làm một bài ngắn để mở streak nào."}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => openPracticeConfirm("/practice")} className="hand-drawn-button hand-drawn-button-primary justify-center text-sm">
                Check-in hôm nay
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
          <h2 className="mb-4 text-lg font-black text-black">Chọn chủ đề luyện tập</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {TOPICS.map((t) => (
              <button
                type="button"
                key={t.label}
                onClick={() => openPracticeConfirm(t.href)}
                className={`group flex flex-col items-center gap-3 rounded-[1.5rem] border-[3px] border-black ${t.color} p-5 text-center shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
              >
                <span className="text-3xl">{t.emoji}</span>
                <span className="text-sm font-extrabold leading-tight text-black">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border-[3px] border-black bg-brand-primary p-8 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Bộ đề hôm nay đang chờ bạn ✨</h2>
              <p className="mt-1 text-sm text-white/80">25 câu · ~15 phút · Điều chỉnh theo level của bạn</p>
            </div>
            <button
              type="button"
              onClick={() => openPracticeConfirm("/practice")}
              className="flex-shrink-0 rounded-full border-[2.5px] border-white bg-white px-6 py-3 text-sm font-extrabold text-brand-primary shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              Làm bài ngay →
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
            <h2 className="text-2xl font-black text-black">Sẵn sàng làm bài chưa?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Khi bắt đầu, bạn sẽ vào chế độ làm bài tập trung. Bạn chỉ quay lại màn hình chính sau khi nộp bài và xem kết quả.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setPendingPracticeHref(null)} className="hand-drawn-button hand-drawn-button-secondary flex-1 justify-center text-sm">
                Chưa, để sau
              </button>
              <button type="button" onClick={startPractice} className="hand-drawn-button hand-drawn-button-primary flex-1 justify-center text-sm">
                Bắt đầu
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
