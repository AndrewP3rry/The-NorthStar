import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function run(script, args = []) {
  const { stdout, stderr } = await execFileAsync("node", [script, ...args], {
    cwd: process.cwd(),
  });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

async function main() {
  const target = Number(process.argv[2] ?? 25);
  await run("tools/generate_questions.mjs");
  await run("tools/validate_schema.mjs");
  await run("tools/deduplicate_questions.mjs");
  await run("tools/publish_batch.mjs", [String(target)]);

  console.log("Daily pipeline completed successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
