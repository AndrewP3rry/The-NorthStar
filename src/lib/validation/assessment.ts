import { z } from "zod";

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.enum(["A", "B", "C", "D"]).nullable(),
  timeSpentSec: z.number().int().nonnegative(),
});

export const submitSessionSchema = z.object({
  userId: z.string().uuid(),
  answers: z.array(submitAnswerSchema).min(1),
});

export type SubmitSessionPayload = z.infer<typeof submitSessionSchema>;
