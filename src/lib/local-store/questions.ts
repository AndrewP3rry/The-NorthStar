import { fallbackQuestionBatch } from "@/lib/question-bank";

export type FallbackQuestion = {
  id: string;
  correctOption: string;
  explanation: string;
  topic: "numerical" | "verbal" | "logical" | "data_interpretation" | "visual";
};

export async function readFallbackQuestions(): Promise<Map<string, FallbackQuestion>> {
  return new Map(
    fallbackQuestionBatch.questions.map((q) => [
      q.id,
      {
        id: q.id,
        correctOption: q.correctOption,
        explanation: q.explanation,
        topic: q.topic,
      },
    ])
  );
}
