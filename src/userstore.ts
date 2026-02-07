import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type UserPrefs = {
  wallet?: string; // public key for simulation
};

type Store = {
  users: Record<string, UserPrefs>;
};

const PATH = process.env.BLINKGUARD_USERSTORE_PATH ?? '.data/blinkguard_users.json';

function load(): Store {
  try {
    if (!existsSync(PATH)) return { users: {} };
    return JSON.parse(readFileSync(PATH, 'utf8')) as Store;
  } catch {
    return { users: {} };
  }
}

function save(s: Store) {
  mkdirSync(resolve(PATH, '..'), { recursive: true });
  writeFileSync(PATH, JSON.stringify(s, null, 2));
}

export function getUserPrefs(userId: number): UserPrefs {
  const s = load();
  return s.users[String(userId)] ?? {};
}

export function setUserWallet(userId: number, wallet: string) {
  const s = load();
  s.users[String(userId)] = { ...(s.users[String(userId)] ?? {}), wallet };
  save(s);
}
