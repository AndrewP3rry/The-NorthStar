import { readFile, writeFile } from "node:fs/promises";

function normalizeStem(stem) {
  return stem
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const payload = JSON.parse(await readFile(".tmp/pipeline/validated.json", "utf8"));
  const seen = new Set();
  const unique = [];
  const duplicates = [];

  for (const question of payload.passed ?? []) {
    const optionSignature = (question.options ?? [])
      .map((opt) => `${opt.key}:${String(opt.text).toLowerCase().trim()}`)
      .join("|");
    const key = `${question.topic}:${normalizeStem(question.stem)}:${optionSignature}`;
    if (seen.has(key)) {
      duplicates.push(question);
      continue;
    }
    seen.add(key);
    unique.push(question);
  }

  await writeFile(
    ".tmp/pipeline/deduped.json",
    JSON.stringify({ unique, duplicates, rejected: payload.rejected ?? [] }, null, 2)
  );
  console.log(`Dedup complete: ${unique.length} unique, ${duplicates.length} duplicates.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
