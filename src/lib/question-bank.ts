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

export function mapBankQuestion(q: BankQuestion) {
  return {
    id: q.id,
    topic: q.topic,
    difficulty: q.difficulty,
    stem: q.stem,
    options: [
      { key: "A", text: q.optionA },
      { key: "B", text: q.optionB },
      { key: "C", text: q.optionC },
      { key: "D", text: q.optionD },
    ],
    estimatedTimeSec: q.estimatedTimeSec,
    questionType: q.questionType ?? "text",
    imageSvg: q.imageSvg ?? null,
    patternId: q.patternId,
  };
}
