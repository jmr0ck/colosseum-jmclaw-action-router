import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import crypto from 'node:crypto';

export type CallbackPayload = {
  actionUrl: string;
  rpcUrl: string;
};

type RecordItem = {
  id: string;
  createdAt: number;
  payload: CallbackPayload;
};

type Store = {
  items: Record<string, RecordItem>;
};

const PATH = process.env.BLINKGUARD_CALLBACKS_PATH ?? '.data/blinkguard_callbacks.json';
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function load(): Store {
  try {
    if (!existsSync(PATH)) return { items: {} };
    return JSON.parse(readFileSync(PATH, 'utf8')) as Store;
  } catch {
    return { items: {} };
  }
}

function save(s: Store) {
  mkdirSync(resolve(PATH, '..'), { recursive: true });
  writeFileSync(PATH, JSON.stringify(s, null, 2));
}

function cleanup(s: Store) {
  const now = Date.now();
  for (const [k, v] of Object.entries(s.items)) {
    if (now - v.createdAt > TTL_MS) delete s.items[k];
  }
}

export function putCallbackPayload(p: CallbackPayload): string {
  const s = load();
  cleanup(s);

  const base = `${p.rpcUrl}|${p.actionUrl}`;
  const id = crypto.createHash('sha256').update(base).digest('base64url').slice(0, 18);

  s.items[id] = { id, createdAt: Date.now(), payload: p };
  save(s);
  return id;
}

export function getCallbackPayload(id: string): CallbackPayload | null {
  const s = load();
  cleanup(s);
  const item = s.items[id];
  if (!item) return null;
  return item.payload;
}
