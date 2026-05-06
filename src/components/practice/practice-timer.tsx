"use client";

import { useEffect, useMemo, useState } from "react";

type PracticeTimerProps = {
  durationSeconds: number;
};

export function PracticeTimer({ durationSeconds }: PracticeTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = useMemo(() => Math.floor(remaining / 60), [remaining]);
  const seconds = useMemo(() => remaining % 60, [remaining]);
  const isWarning = remaining <= 5 * 60;

  return (
    <span
      className={`text-sm font-extrabold tabular-nums transition-colors duration-300 ${
        isWarning ? "text-rose-600" : "text-slate-600"
      }`}
    >
      {isWarning ? "⚠️ " : ""}{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
