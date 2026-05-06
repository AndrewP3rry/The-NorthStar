import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type LocalSession = {
  id: string;
  userId: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  startedAt: string;
  endedAt: string;
};

type LocalHistoryStore = {
  sessions: LocalSession[];
};

const HISTORY_DIR = path.join(process.cwd(), ".tmp", "local-store");
const HISTORY_FILE = path.join(HISTORY_DIR, "history.json");

async function ensureStore() {
  await mkdir(HISTORY_DIR, { recursive: true });
}

function toDateKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export async function readLocalHistory(): Promise<LocalHistoryStore> {
  await ensureStore();

  try {
    const raw = await readFile(HISTORY_FILE, "utf8");
    return JSON.parse(raw) as LocalHistoryStore;
  } catch {
    return { sessions: [] };
  }
}

export async function getLocalStreak(userId: string): Promise<number> {
  const store = await readLocalHistory();
  const keys = [...new Set(store.sessions.filter((s) => s.userId === userId).map((s) => toDateKey(s.startedAt)))].sort().reverse();

  if (keys.length === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  for (const key of keys) {
    const expected = cursor.toISOString().slice(0, 10);
    if (key !== expected) {
      break;
    }
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export async function appendLocalSession(session: LocalSession) {
  const store = await readLocalHistory();
  store.sessions.unshift(session);
  store.sessions = store.sessions.slice(0, 100);
  await writeFile(HISTORY_FILE, JSON.stringify(store, null, 2));
}

