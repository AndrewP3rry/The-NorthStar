import { readFile } from "node:fs/promises";
import path from "node:path";

export type FallbackQuestion = {
  id: string;
  correctOption: string;
  explanation: string;
  topic: "numerical" | "verbal" | "logical" | "data_interpretation";
};

type LocalBatchFile = {
  questions: Array<{
    id: string;
    correctOption: string;
    explanation: string;
    topic: "numerical" | "verbal" | "logical" | "data_interpretation";
  }>;
};

export async function readFallbackQuestions(): Promise<Map<string, FallbackQuestion>> {
  try {
    const publishedPath = path.join(process.cwd(), ".tmp", "pipeline", "published_batch.json");
    const payload = JSON.parse(await readFile(publishedPath, "utf8")) as LocalBatchFile;
    return new Map(payload.questions.map((q) => [q.id, q]));
  } catch {
    return new Map();
  }
}
