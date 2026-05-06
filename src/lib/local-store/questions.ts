import { readFile } from "node:fs/promises";
import path from "node:path";

export type FallbackQuestion = {
  id: string;
  correctOption: string;
  explanation: string;
  topic: "numerical" | "verbal" | "logical" | "data_interpretation" | "visual";
};

type LocalBatchFile = {
  questions: Array<{
    id: string;
    correctOption: string;
    explanation: string;
    topic: "numerical" | "verbal" | "logical" | "data_interpretation" | "visual";
  }>;
};

export async function readFallbackQuestions(): Promise<Map<string, FallbackQuestion>> {
  const candidates = [
    path.join(process.cwd(), ".tmp", "pipeline", "published_batch.json"),
    path.join(process.cwd(), "data", "published_batch.json"),
  ];

  for (const publishedPath of candidates) {
    try {
      const payload = JSON.parse(await readFile(publishedPath, "utf8")) as LocalBatchFile;
      return new Map(payload.questions.map((q) => [q.id, q]));
    } catch {
      // Try the next source. Vercel does not include local .tmp files.
    }
  }

  return new Map();
}
