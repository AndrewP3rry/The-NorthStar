import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";

const execFileAsync = promisify(execFile);

type PublishedBatch = {
  batchId: string;
  name: string;
  status: "published";
  language: string;
  publishedAt: string;
  questions: Array<{
    id: string;
    topic: "numerical" | "verbal" | "logical" | "data_interpretation" | "visual";
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

async function persistBatch(batch: PublishedBatch) {
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
      update: {
        topic: question.topic,
        difficulty: question.difficulty,
        language: question.language,
        stem: question.stem,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        correctOption: question.correctOption,
        explanation: question.explanation,
        estimatedTimeSec: question.estimatedTimeSec,
      },
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

export async function POST() {
  try {
    const cwd = process.cwd();
    const script = path.join(cwd, "tools", "run_daily_pipeline.mjs");

    const { stdout, stderr } = await execFileAsync("node", [script, "25"], { cwd });

    const publishedPath = path.join(cwd, ".tmp", "pipeline", "published_batch.json");
    const published = JSON.parse(await readFile(publishedPath, "utf8")) as PublishedBatch;

    let persisted = false;
    let batchId = published.batchId;

    try {
      batchId = await persistBatch(published);
      persisted = true;
    } catch {
      persisted = false;
    }

    return NextResponse.json({
      ok: true,
      persisted,
      batchId,
      message: "Pipeline sinh đề đã chạy xong.",
      logs: stdout,
      warnings: stderr || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Pipeline chạy thất bại.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
