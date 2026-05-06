import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";

type PublishedBatch = {
  batchId: string;
  name: string;
  status: "published";
  language: string;
  publishedAt: string;
  questions: Array<{
    id: string;
    topic: "numerical" | "verbal" | "logical" | "data_interpretation";
    difficulty: "easy" | "medium" | "hard";
    language: string;
    stem: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: "A" | "B" | "C" | "D";
    explanation: string;
    estimatedTimeSec: number;
  }>;
};

async function seedFromPublished() {
  const filePath = path.join(process.cwd(), ".tmp", "pipeline", "published_batch.json");
  const batch = JSON.parse(await readFile(filePath, "utf8")) as PublishedBatch;

  const createdBatch = await prisma.questionBatch.create({
    data: {
      id: batch.batchId,
      name: batch.name,
      status: "published",
      language: batch.language,
      publishedAt: new Date(batch.publishedAt),
    },
  });

  for (let i = 0; i < batch.questions.length; i += 1) {
    const question = batch.questions[i];
    await prisma.question.upsert({
      where: { id: question.id },
      update: question,
      create: question,
    });

    await prisma.batchQuestion.create({
      data: {
        batchId: createdBatch.id,
        questionId: question.id,
        orderIndex: i,
      },
    });
  }

  return createdBatch.id;
}

async function main() {
  const batchId = await seedFromPublished();
  console.log(`Seed completed for batch ${batchId}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
