"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { OptionKey, PracticeQuestion } from "@/types/assessment";
import { CheckCircle2, XCircle, BookOpen, Clock, ChevronRight, ChevronLeft, Menu, Bookmark, List } from "lucide-react";
import { useSearchParams } from "next/navigation";

type DailyResponse = {
  batchId: string;
  targetCount: number;
  streak?: number;
  questions: PracticeQuestion[];
};

type SubmitResult = {
  total: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  answers: Array<{
    questionId: string;
    selectedOption: OptionKey | null;
    correctOption: OptionKey | null;
    explanation: string;
    isCorrect: boolean;
  }>;
};

type SessionHistory = {
  id: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  startedAt: string;
};

const DEMO_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

const TOPIC_LABELS: Record<string, string> = {
  numerical: "🔢 Tư duy Số",
  verbal: "📝 Ngôn ngữ",
  logical: "🧩 Logic",
  data_interpretation: "📊 Dữ liệu",
  visual: "👁️ Hình học",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-brand-secondary text-black",
  medium: "bg-brand-accent text-black",
  hard: "bg-brand-peach text-black",
};

function ImageBlock({ svg }: { svg: string }) {
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border-[2px] border-black">
      <Image src={src} alt="question visual" width={360} height={220} className="h-auto w-full" unoptimized />
    </div>
  );
}

/* ── Progress bar ── */
function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-3 w-full overflow-hidden rounded-full border-[2px] border-black bg-white">
      <motion.div
        className="h-full rounded-full bg-brand-primary"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}

/* ── Score ring (results) ── */
function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-2xl font-black text-black">{score}%</span>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 pb-20 pt-2">
          <div className="hand-drawn-card flex flex-col items-center gap-4 p-12 text-center">
            <div className="text-4xl animate-bounce">📚</div>
            <p className="text-lg font-black text-black">Đang tải bài luyện tập...</p>
          </div>
        </main>
      }
    >
      <PracticePageContent />
    </Suspense>
  );
}

function PracticePageContent() {
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic");

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, OptionKey>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showOutline, setShowOutline] = useState(false);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const loadHistory = useCallback(async () => {
    const res = await fetch(`/api/results/history?userId=${DEMO_USER_ID}`, { cache: "no-store" });
    const data = await res.json();
    setHistory(data.sessions ?? []);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        let url = `/api/assessments/daily?userId=${DEMO_USER_ID}`;
        let timeLimit = 20 * 60;

        if (topic) {
          // Topic practice: 15 questions, 15 minutes
          url = `/api/questions?topic=${topic}&limit=15&random=true`;
          timeLimit = 15 * 60;
        }

        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        
        setQuestions(data.questions ?? []);
        if (!topic) setStreak(data.streak ?? 0);
        
        setTimeLeft(timeLimit);
        await loadHistory();
      } catch {
        setError("Không tải được câu hỏi. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [topic, loadHistory]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);


  const toggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const answeredCount = useMemo(() => Object.keys(selected).length, [selected]);

  const handleChoose = (questionId: string, option: OptionKey) => {
    setSelected((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (!questions.length || result) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        userId: DEMO_USER_ID,
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedOption: selected[q.id] ?? null,
          timeSpentSec: q.estimatedTimeSec,
        })),
      };
      const res = await fetch("/api/results/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Nộp bài thất bại."); return; }
      setResult(data.result as SubmitResult);
      await loadHistory();
    } catch {
      setError("Có lỗi khi nộp bài.");
    } finally {
      setSubmitting(false);
    }
  }, [loadHistory, questions, result, selected]);

  // Auto-submit when time runs out.
  useEffect(() => {
    if (timeLeft === 0 && !result && !submitting) {
      const submitTimer = window.setTimeout(() => void handleSubmit(), 0);
      return () => window.clearTimeout(submitTimer);
    }
  }, [timeLeft, result, submitting, handleSubmit]);

  // Keep the learner in focus mode until the session has a result.
  useEffect(() => {
    if (result || typeof window === "undefined") return;
    window.history.pushState(null, "", window.location.href);
    const keepInPractice = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", keepInPractice);
    return () => window.removeEventListener("popstate", keepInPractice);
  }, [result]);

  /* ── Loading ── */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 pb-20 pt-2">
        <div className="hand-drawn-card flex flex-col items-center gap-4 p-12 text-center">
          <div className="text-4xl animate-bounce">📚</div>
          <p className="text-lg font-black text-black">Đang tải đề hôm nay...</p>
          <p className="text-sm text-slate-500">Vui lòng chờ một chút</p>
        </div>
      </main>
    );
  }

  /* ── Results view ── */
  if (result) {
    const answerMap = new Map(result.answers.map((a) => [a.questionId, a]));
    return (
      <main className="min-h-screen px-4 pb-20 pt-2">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">

          {/* Score card */}
          <section className="hand-drawn-card p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kết quả bài thi</p>
            <h1 className="mt-1 text-2xl font-black text-black">Bài luyện tập hôm nay ✨</h1>

            <div className="mt-6 flex flex-wrap items-center gap-8">
              <ScoreRing score={result.score} />
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 rounded-2xl border-[2px] border-black bg-brand-secondary px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="font-extrabold text-black">{result.correctCount} câu đúng</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border-[2px] border-black bg-brand-peach px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <XCircle size={18} className="text-rose-500" />
                  <span className="font-extrabold text-black">{result.wrongCount} câu sai</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setResult(null); setSelected({}); setLoading(true); void (async () => { const res = await fetch(`/api/assessments/daily?userId=${DEMO_USER_ID}`, { cache: "no-store" }); const data = (await res.json()) as DailyResponse; setQuestions(data.questions ?? []); setStreak(data.streak ?? 0); setLoading(false); })(); }}
                className="hand-drawn-button hand-drawn-button-secondary text-sm"
              >
                Làm lại
              </button>
              <Link href="/" className="hand-drawn-button hand-drawn-button-primary text-sm">
                Về trang chủ
              </Link>
            </div>
          </section>

          {history.length > 0 && (
            <section className="rounded-[1.5rem] border-[3px] border-black bg-white p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="flex items-center gap-2 text-sm font-black text-black">
                <BookOpen size={16} /> Lịch sử gần nhất
              </h3>
              <div className="mt-3 space-y-2">
                {history.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-xs">
                    <span className="text-slate-500">{new Date(s.startedAt).toLocaleDateString("vi-VN")}</span>
                    <span className="font-black text-black">{s.score}%</span>
                    <span className="text-slate-500">{s.correctCount}✓ {s.wrongCount}✗</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Review */}
          {questions.map((q, idx) => {
            const ans = answerMap.get(q.id);
            const selectedOption = selected[q.id];
            const correctOption = ans?.correctOption ?? null;
            const isCorrect = ans?.isCorrect ?? false;
            return (
              <article
                key={q.id}
                className={`rounded-[1.5rem] border-[3px] border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] ${isCorrect ? "bg-brand-secondary/30" : "bg-brand-peach/30"}`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full border-[2px] border-black bg-white px-2 py-0.5 text-xs font-black">Câu {idx + 1}</span>
                  {isCorrect
                    ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-300">✓ Đúng</span>
                    : <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-300">✗ Sai</span>
                  }
                </div>
                <h3 className="text-sm font-bold text-black">{q.stem}</h3>
                {q.questionType === "image" && q.imageSvg ? <ImageBlock svg={q.imageSvg} /> : null}

                <div className="mt-3 grid gap-2">
                  {q.options.map((opt) => {
                    const isSelected = selectedOption === opt.key;
                    const isRight = correctOption === opt.key;
                    return (
                      <div
                        key={opt.key}
                        className={`rounded-xl border-[2px] px-3 py-2 text-sm ${
                          isRight
                            ? "border-emerald-400 bg-emerald-50 font-bold text-emerald-800"
                            : isSelected
                            ? "border-rose-400 bg-rose-50 text-rose-800"
                            : "border-black/20 text-slate-600"
                        }`}
                      >
                        <span className="font-extrabold mr-2">{opt.key}.</span>{opt.text}
                      </div>
                    );
                  })}
                </div>

                {ans?.explanation && (
                  <div className="mt-3 rounded-xl border-[2px] border-dashed border-black/30 bg-white/70 p-3 text-xs text-slate-600">
                    💡 {ans.explanation}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>
    );
  }

  /* ── Practice view ── */
  const currentQuestion = questions[currentIndex];

  return (
    <main className="min-h-screen bg-brand-bg pb-64 pt-2 md:pb-52">
      <div className="mx-auto flex w-full max-w-6xl px-4 gap-6">
        
        {/* Sidebar Outline */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-80 transform border-r-[3px] border-black bg-white p-6 transition-transform duration-300 shadow-[10px_0px_0px_0px_rgba(0,0,0,0.05)] lg:sticky lg:top-6 lg:h-[calc(100vh-80px)] lg:translate-x-0 lg:rounded-3xl lg:border-[3px] lg:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${showOutline ? "translate-x-0" : "-translate-x-full lg:hidden"}`}>
          <div className="mb-8 flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-xl font-black text-black flex items-center gap-2">
                <List size={24} className="text-brand-primary" /> Mục lục
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Tiến độ: {answeredCount}/{questions.length}</p>
            </div>
            <button onClick={() => setShowOutline(false)} className="lg:hidden p-2 hover:bg-slate-100 rounded-full border-2 border-black">
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-2 custom-scrollbar">
            {questions.map((q, idx) => {
              const isAnswered = !!selected[q.id];
              const isBookmarked = bookmarks.has(q.id);
              const isCurrent = currentIndex === idx;
              
              // Visual priority: Current > Bookmarked > Answered > Unanswered
              let btnClass = "bg-white text-slate-400 opacity-60";
              if (isCurrent) {
                btnClass = "bg-brand-primary text-white scale-105 z-10 border-brand-primary";
              } else if (isBookmarked) {
                btnClass = "bg-[#FFD700] text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"; // Vàng rực rỡ cho bookmark
              } else if (isAnswered) {
                btnClass = "bg-brand-secondary text-black opacity-100";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    if (window.innerWidth < 1024) setShowOutline(false);
                  }}
                  className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border-[2.5px] border-black text-base font-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${btnClass}`}
                >
                  {idx + 1}
                  {isBookmarked && (
                    <div className="absolute -top-2 -right-2 bg-brand-accent border-[2px] border-black p-0.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce-subtle">
                      <Bookmark size={10} fill="currentColor" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 space-y-3 pt-6 border-t-2 border-black/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Chú thích</h4>
            <div className="flex items-center gap-3 text-xs font-black text-black">
              <div className="h-4 w-4 rounded-lg bg-brand-primary border-2 border-black" /> Đang xem
            </div>
            <div className="flex items-center gap-3 text-xs font-black text-black">
              <div className="h-4 w-4 rounded-lg bg-[#FFD700] border-2 border-black" /> Đã đánh dấu
            </div>
            <div className="flex items-center gap-3 text-xs font-black text-black">
              <div className="h-4 w-4 rounded-lg bg-brand-secondary border-2 border-black" /> Đã trả lời
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Header card */}
          <header className="hand-drawn-card p-6 bg-white">
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={() => setShowOutline(!showOutline)} 
                className={`p-3 hover:bg-slate-50 rounded-2xl border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${showOutline ? "bg-brand-secondary" : "bg-white"}`}
              >
                <Menu size={22} />
              </button>
              
              <div className="flex-1 text-center hidden sm:block">
                <h1 className="text-xl font-black text-black">
                  {topic ? TOPIC_LABELS[topic] : "Thử thách Daily"}
                </h1>
              </div>

              <div className={`flex items-center gap-3 rounded-2xl border-[3px] border-black bg-white px-5 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors ${timeLeft !== null && timeLeft <= 120 ? "animate-pulse border-rose-500 bg-rose-50 text-rose-600" : ""}`}>
                <Clock size={20} className={timeLeft !== null && timeLeft <= 120 ? "text-rose-500" : "text-slate-400"} />
                <span className="text-lg font-black tabular-nums tracking-tight">{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-6 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Tiến độ bài thi</span>
                <span>{answeredCount}/{questions.length} câu</span>
              </div>
              <ProgressBar value={answeredCount} total={questions.length} />
            </div>
          </header>

          {error && (
            <div className="rounded-2xl border-[2px] border-rose-400 bg-rose-50 p-4 text-sm font-bold text-rose-700 shadow-[3px_3px_0px_0px_rgba(239,68,68,0.3)]">
              ⚠️ {error}
            </div>
          )}

          {currentQuestion && (
            <motion.article
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="hand-drawn-card p-6 md:p-8 flex flex-col flex-1"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl border-[2.5px] border-black bg-brand-primary px-4 py-1.5 text-lg font-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    Câu {currentIndex + 1}
                  </span>
                  <span className={`rounded-xl border-[2.5px] border-black px-4 py-1.5 text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${DIFFICULTY_COLORS[currentQuestion.difficulty] ?? "bg-white text-black"}`}>
                    {currentQuestion.difficulty.toUpperCase()}
                  </span>
                </div>
                
                <button
                  onClick={() => toggleBookmark(currentQuestion.id)}
                  aria-label={bookmarks.has(currentQuestion.id) ? "Bỏ đánh dấu" : "Đánh dấu câu hỏi"}
                  title={bookmarks.has(currentQuestion.id) ? "Bỏ đánh dấu" : "Đánh dấu câu hỏi"}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border-[2.5px] border-black text-xs font-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                    bookmarks.has(currentQuestion.id) ? "bg-brand-accent text-black" : "bg-white text-slate-500"
                  }`}
                >
                  <Bookmark size={16} fill={bookmarks.has(currentQuestion.id) ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-bold leading-relaxed text-black mb-6">
                  {currentQuestion.stem}
                </h2>
                
                {currentQuestion.questionType === "image" && currentQuestion.imageSvg ? (
                  <div className="mb-8">
                    <ImageBlock svg={currentQuestion.imageSvg} />
                  </div>
                ) : null}

                <div className="grid gap-3.5">
                  {currentQuestion.options.map((opt) => {
                    const active = selected[currentQuestion.id] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleChoose(currentQuestion.id, opt.key)}
                        className={`group flex items-center w-full rounded-2xl border-[3px] px-5 py-4 text-left text-base font-bold transition-all duration-200 ${
                          active
                            ? "border-brand-primary bg-brand-primary/10 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            : "border-black bg-white text-slate-700 hover:bg-slate-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        }`}
                      >
                        <span className={`mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-[2.5px] border-black text-sm font-black transition-colors ${
                          active ? "bg-brand-primary text-white" : "bg-white text-black group-hover:bg-brand-secondary"
                        }`}>
                          {opt.key}
                        </span>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation within card */}
              <div className="mt-12 flex items-center justify-between gap-4">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-[2.5px] border-black font-black transition-all ${
                    currentIndex === 0 ? "opacity-30 grayscale cursor-not-allowed" : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-slate-50"
                  }`}
                >
                  <ChevronLeft size={20} />
                  Câu trước
                </button>

                <div className="hidden sm:block text-xs font-black text-slate-400">
                  {currentIndex + 1} / {questions.length}
                </div>

                <button
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-[2.5px] border-black font-black transition-all ${
                    currentIndex === questions.length - 1 ? "opacity-30 grayscale cursor-not-allowed" : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-slate-50"
                  }`}
                >
                  Câu tiếp
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.article>
          )}
        </div>
      </div>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-2 bg-gradient-to-t from-white via-white/80 to-transparent sm:py-3">
        <div className="mx-auto max-w-6xl flex justify-end">
          <div className="w-full lg:w-[calc(100%-19.5rem)]">
            <div className="rounded-3xl border-[3px] border-black bg-white p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 sm:p-4">
              <div className="flex-1 flex items-center gap-4 px-1 sm:px-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Trạng thái</span>
                  <span className="text-sm font-black text-black">
                    {answeredCount === questions.length ? "✨ Sẵn sàng nộp bài!" : `Đã làm ${answeredCount}/${questions.length} câu`}
                  </span>
                </div>
                <div className="h-8 w-[2px] bg-black/10 hidden md:block" />
                <div className="hidden md:flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Thời gian</span>
                  <span className={`text-sm font-black ${timeLeft !== null && timeLeft <= 120 ? "text-rose-500" : "text-black"}`}>
                    {timeLeft !== null ? formatTime(timeLeft) : "--:--"} còn lại
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || answeredCount === 0}
                className={`flex h-12 w-auto min-w-[168px] items-center justify-center gap-2 rounded-2xl border-[3px] border-black px-4 text-sm font-black transition-all duration-300 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-14 sm:min-w-[240px] sm:gap-3 sm:px-8 sm:text-base ${
                  submitting || answeredCount === 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-300"
                    : "bg-brand-primary text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                {submitting ? "Đang chấm điểm..." : "Nộp bài và hoàn tất"}
                {!submitting && <ChevronRight size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
