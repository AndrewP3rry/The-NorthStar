import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

function mapQuestionToDb(question) {
  return {
    id: question.question_id,
    topic: question.topic,
    difficulty: question.difficulty,
    language: question.language,
    stem: question.stem,
    optionA: question.options[0].text,
    optionB: question.options[1].text,
    optionC: question.options[2].text,
    optionD: question.options[3].text,
    correctOption: question.correct_option,
    explanation: question.explanation,
    estimatedTimeSec: question.estimated_time_sec,
    patternId: question.pattern_id,
    questionType: question.question_type,
    imageSvg: question.image_svg,
  };
}

async function main() {
  const target = Number(process.argv[2] ?? 20);
  const payload = JSON.parse(await readFile(".tmp/pipeline/deduped.json", "utf8"));
  const selected = payload.unique ?? [];

  if (selected.length < target) {
    throw new Error(`Not enough valid questions to publish. Required at least ${target}, got=${selected.length}`);
  }

  const batch = {
    batchId: randomUUID(),
    name: `daily-${new Date().toISOString().slice(0, 10)}`,
    status: "published",
    language: "vi",
    publishedAt: new Date().toISOString(),
    questions: selected.map(mapQuestionToDb),
  };

  await writeFile(".tmp/pipeline/published_batch.json", JSON.stringify(batch, null, 2));
  console.log(`Published pool prepared with ${selected.length} questions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
