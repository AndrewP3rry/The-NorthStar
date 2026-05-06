"use client";

import { useState } from "react";

type TriggerResponse = {
  ok: boolean;
  message?: string;
  batchId?: string;
  persisted?: boolean;
  logs?: string;
  warnings?: string | null;
  error?: string;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriggerResponse | null>(null);

  const runPipeline = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/generation/trigger", { method: "POST" });
      const data = (await response.json()) as TriggerResponse;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Không thể gọi pipeline." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Admin Generation Console</h1>
        <p className="mt-3 text-sm text-slate-600">Chạy pipeline sinh đề daily 25 câu và publish tự động.</p>

        <button
          type="button"
          onClick={runPipeline}
          disabled={loading}
          className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Đang chạy pipeline..." : "Run Daily Pipeline"}
        </button>

        {result ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              Trạng thái: <strong>{result.ok ? "Success" : "Failed"}</strong>
            </p>
            {result.message ? <p className="mt-1">{result.message}</p> : null}
            {result.batchId ? <p className="mt-1">Batch ID: {result.batchId}</p> : null}
            {typeof result.persisted === "boolean" ? (
              <p className="mt-1">Lưu DB: {result.persisted ? "Có" : "Chưa (đang dùng file fallback)"}</p>
            ) : null}
            {result.error ? <p className="mt-1 text-rose-700">{result.error}</p> : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
