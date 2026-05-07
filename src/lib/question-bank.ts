import publishedBatch from "../../data/published_batch.json";

export type Topic = "numerical" | "verbal" | "logical" | "data_interpretation" | "visual";
export type Difficulty = "easy" | "medium" | "hard";

export type BankQuestion = {
  id: string;
  topic: Topic;
  difficulty: Difficulty;
  language?: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  estimatedTimeSec: number;
  questionType?: "text" | "image";
  imageSvg?: string | null;
  patternId?: string;
};

export type PublishedQuestionBatch = {
  batchId: string;
  name?: string;
  status?: "published";
  language?: string;
  publishedAt?: string;
  questions: BankQuestion[];
};

export const fallbackQuestionBatch = publishedBatch as PublishedQuestionBatch;

const viNumberFormatter = new Intl.NumberFormat("vi-VN");

function formatInteger(value: string | number) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return String(value);
  return viNumberFormatter.format(numericValue);
}

export function formatAssessmentText(text: string) {
  return text
    .replace(/\b(\d+)\s*(triệu)\b/gi, (_match, amount: string) => `${formatInteger(Number(amount) * 1_000_000)} VND`)
    .replace(/\b(\d+)\s*(nghìn|ngàn)\b/gi, (_match, amount: string) => `${formatInteger(Number(amount) * 1_000)} VND`)
    .replace(/\b(\d{4,})\s*(đ|vnd)\b/gi, (_match, amount: string) => `${formatInteger(amount)} VND`)
    .replace(/\b\d{4,}\b/g, (amount) => formatInteger(amount));
}

export function mapBankQuestion(q: BankQuestion) {
  return {
    id: q.id,
    topic: q.topic,
    difficulty: q.difficulty,
    stem: formatAssessmentText(q.stem),
    options: [
      { key: "A", text: formatAssessmentText(q.optionA) },
      { key: "B", text: formatAssessmentText(q.optionB) },
      { key: "C", text: formatAssessmentText(q.optionC) },
      { key: "D", text: formatAssessmentText(q.optionD) },
    ],
    estimatedTimeSec: q.estimatedTimeSec,
    questionType: q.questionType ?? "text",
    imageSvg: q.imageSvg ?? null,
    patternId: q.patternId,
  };
}
