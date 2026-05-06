"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

export function StreakBadge() {
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/streak?userId=guest")
      .then((r) => r.json())
      .then(({ streak }) => setStreak(streak))
      .catch(() => setStreak(0));
  }, []);

  if (streak === null || streak === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border-[2px] border-black bg-brand-peach px-4 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <Flame size={18} className="text-orange-500" fill="currentColor" />
      <span className="text-sm font-extrabold text-black">{streak} ngày liên tiếp 🔥</span>
    </div>
  );
}
