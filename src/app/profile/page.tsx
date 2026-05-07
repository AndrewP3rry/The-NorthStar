"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, Save, Sparkles } from "lucide-react";

type ProfileUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt?: string;
};

type TopicStat = {
  topic: string;
  label: string;
  score: number;
  correct: number;
  total: number;
};

type ProfileStats = {
  summary: {
    totalSessions: number;
    averageScore: number;
    totalCorrect: number;
    totalWrong: number;
    strongest: TopicStat;
    weakest: TopicStat;
  };
  topicStats: TopicStat[];
  recentSessions: Array<{ id: string; score: number; correctCount: number; wrongCount: number; startedAt: string }>;
};

const PRESET_AVATARS = ["🧭", "🔥", "🌟", "🦊", "🐼", "🐯", "🚀", "🧠"];

function presetAvatarDataUrl(emoji: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='160' height='160' rx='48' fill='#F6E2D3'/><circle cx='80' cy='80' r='70' fill='#B7E5D6' opacity='.55'/><text x='80' y='100' font-size='72' text-anchor='middle'>${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function PentagonChart({ stats }: { stats: TopicStat[] }) {
  const center = 130;
  const maxRadius = 92;
  const points = stats.map((item, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(stats.length, 1);
    const radius = (Math.max(item.score, 4) / 100) * maxRadius;
    return {
      ...item,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (maxRadius + 30),
      labelY: center + Math.sin(angle) * (maxRadius + 30),
      axisX: center + Math.cos(angle) * maxRadius,
      axisY: center + Math.sin(angle) * maxRadius,
    };
  });
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg viewBox="0 0 260 260" className="h-[300px] w-full max-w-[360px]">
      {[25, 50, 75, 100].map((level) => {
        const radius = (level / 100) * maxRadius;
        const ring = stats
          .map((_, index) => {
            const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(stats.length, 1);
            return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
          })
          .join(" ");
        return <polygon key={level} points={ring} fill="none" stroke="#0f172a" strokeDasharray="4 5" strokeOpacity="0.18" strokeWidth="1.5" />;
      })}
      {points.map((point) => (
        <line key={point.topic} x1={center} y1={center} x2={point.axisX} y2={point.axisY} stroke="#0f172a" strokeOpacity="0.14" strokeWidth="1.5" />
      ))}
      <polygon points={polygon} fill="#7A627A" fillOpacity="0.34" stroke="#7A627A" strokeWidth="4" strokeLinejoin="round" />
      {points.map((point) => (
        <g key={point.topic}>
          <circle cx={point.x} cy={point.y} r="5" fill="#7A627A" stroke="#0f172a" strokeWidth="2" />
          <text x={point.labelX} y={point.labelY} textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 text-[10px] font-black">
            {point.label}
          </text>
          <text x={point.labelX} y={point.labelY + 13} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[9px] font-bold">
            {point.score}%
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!data.user) return;
        setUser(data.user);
        setName(data.user.name ?? "");
        setAvatarUrl(data.user.picture);
      })
      .catch(() => setError("Không tải được profile."));

    fetch("/api/profile/stats", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  const visibleStats = useMemo(() => stats?.topicStats ?? [], [stats]);

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 250_000) {
      setError("Ảnh hơi lớn. Vui lòng chọn ảnh dưới 250KB để MVP lưu nhanh và rẻ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result?.toString());
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Lưu profile thất bại.");
        return;
      }
      setUser(data.user);
      setMessage("Đã lưu profile. Navbar sẽ cập nhật avatar sau khi refresh hoặc chuyển trang.");
      window.dispatchEvent(new CustomEvent("northstar-auth-change", { detail: data.user }));
    } catch {
      setError("Không thể lưu profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen px-4 pb-20 pt-8">
        <section className="hand-drawn-card mx-auto max-w-xl p-8 text-center">
          <h1 className="text-2xl font-black text-black">Bạn cần đăng nhập để xem profile.</h1>
          <Link href="/" className="hand-drawn-button hand-drawn-button-primary mt-6 justify-center text-sm">
            Về trang chủ
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pb-20 pt-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-black text-slate-500 hover:text-black">
          <ArrowLeft size={16} /> Về trang chủ
        </Link>

        <section className="hand-drawn-card overflow-hidden p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative h-24 w-24 overflow-hidden rounded-[2rem] border-[3px] border-black bg-brand-peach shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                {avatarUrl ? <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized /> : <div className="flex h-full w-full items-center justify-center text-4xl">🧭</div>}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Profile</p>
                <h1 className="text-3xl font-black text-black">{user.name}</h1>
                <p className="text-sm font-semibold text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="rounded-3xl border-[3px] border-black bg-brand-secondary p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Average</p>
              <p className="text-3xl font-black text-black">{stats?.summary.averageScore ?? 0}%</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="hand-drawn-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-black text-black"><Camera size={20} /> Avatar & thông tin</h2>
            <div className="mt-4 space-y-3">
              <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border-[2px] border-black px-4 py-3 text-sm font-bold outline-none" placeholder="Tên hiển thị" />
              <label className="block cursor-pointer rounded-2xl border-[2px] border-dashed border-black/40 bg-white px-4 py-3 text-center text-sm font-bold text-slate-600 hover:bg-slate-50">
                Upload avatar cá nhân
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AVATARS.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => setAvatarUrl(presetAvatarDataUrl(emoji))} className="rounded-2xl border-[2px] border-black bg-white p-3 text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                    {emoji}
                  </button>
                ))}
              </div>
              <button type="button" onClick={saveProfile} disabled={saving} className="hand-drawn-button hand-drawn-button-primary w-full justify-center text-sm">
                <Save size={16} /> Lưu profile
              </button>
            </div>
          </section>

          <section className="hand-drawn-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-black text-black"><Sparkles size={20} /> Your Progress</h2>
            <div className="mt-3 flex flex-col items-center gap-4 md:flex-row">
              <PentagonChart stats={visibleStats} />
              <div className="w-full space-y-2">
                {visibleStats.map((item) => (
                  <div key={item.topic} className="rounded-2xl border-[2px] border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between text-sm font-black text-black">
                      <span>{item.label}</span>
                      <span>{item.score}%</span>
                    </div>
                    <p className="text-xs text-slate-500">{item.correct}/{item.total} câu đúng</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {(message || error) && (
          <div className={`rounded-2xl border-[2px] px-4 py-3 text-sm font-bold ${error ? "border-rose-300 bg-rose-50 text-rose-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
            {error ?? message}
          </div>
        )}
      </div>
    </main>
  );
}
