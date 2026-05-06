import { readFile, writeFile } from "node:fs/promises";

const REQUIRED_FIELDS = [
  "question_id",
  "topic",
  "difficulty",
  "language",
  "stem",
  "options",
  "correct_option",
  "explanation",
  "estimated_time_sec",
];

function validateQuestion(question) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!(field in question)) {
      errors.push(`Missing field: ${field}`);
    }
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    errors.push("options must have exactly 4 choices");
  }

  if (!["A", "B", "C", "D"].includes(question.correct_option)) {
    errors.push("correct_option must be one of A/B/C/D");
  }

  const sentenceCount = question.explanation?.split(/[.!?]+/).filter(Boolean).length ?? 0;
  if (sentenceCount < 2 || sentenceCount > 5) {
    errors.push("explanation must have 2-5 sentences");
  }

  return errors;
}

async function main() {
  const payload = JSON.parse(await readFile(".tmp/pipeline/generated.json", "utf8"));
  const passed = [];
  const rejected = [];

  for (const question of payload.questions ?? []) {
    const errors = validateQuestion(question);
    if (errors.length === 0) {
      passed.push(question);
    } else {
      rejected.push({ question_id: question.question_id, errors });
    }
  }

  await writeFile(".tmp/pipeline/validated.json", JSON.stringify({ passed, rejected }, null, 2));
  console.log(`Validation complete: ${passed.length} passed, ${rejected.length} rejected.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
