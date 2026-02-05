import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

type Player = {
  userId: number;
  score: number;
  streak: number;
  lastPlayDate?: string; // YYYY-MM-DD
  rounds: number;
};

type GameState = {
  players: Record<string, Player>;
};

const STATE_PATH = process.env.BLINKGUARD_STATE_PATH ?? '.data/blinkguard_game.json';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): GameState {
  try {
    if (!existsSync(STATE_PATH)) return { players: {} };
    const raw = readFileSync(STATE_PATH, 'utf8');
    return JSON.parse(raw) as GameState;
  } catch {
    return { players: {} };
  }
}

function saveState(state: GameState) {
  const dir = resolve(STATE_PATH, '..');
  mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function getPlayer(userId: number): Player {
  const state = loadState();
  const key = String(userId);
  const p = state.players[key] ?? { userId, score: 0, streak: 0, rounds: 0 };
  // persist if new
  if (!state.players[key]) {
    state.players[key] = p;
    saveState(state);
  }
  return p;
}

export function recordRound(opts: {
  userId: number;
  correct: boolean;
  basePoints: number;
  bonusPoints?: number;
}): Player {
  const state = loadState();
  const key = String(opts.userId);
  const p = state.players[key] ?? { userId: opts.userId, score: 0, streak: 0, rounds: 0 };

  const d = today();
  const playedToday = p.lastPlayDate === d;

  // streak logic
  if (!playedToday) {
    // if last play was yesterday, keep streak; else reset
    const last = p.lastPlayDate;
    if (last) {
      const lastMs = Date.parse(last + 'T00:00:00Z');
      const nowMs = Date.parse(d + 'T00:00:00Z');
      const diffDays = Math.round((nowMs - lastMs) / 86400000);
      if (diffDays === 1) p.streak = Math.min(7, (p.streak ?? 0) + 1);
      else p.streak = 1;
    } else {
      p.streak = 1;
    }
    p.lastPlayDate = d;
  }

  let delta = 0;
  if (opts.correct) delta += opts.basePoints;
  if (opts.bonusPoints) delta += opts.bonusPoints;

  // daily streak bonus only on first round of the day
  if (!playedToday) delta += Math.min(14, p.streak * 2);

  p.score += delta;
  p.rounds += 1;

  state.players[key] = p;
  saveState(state);
  return p;
}

export function leaderboard(limit = 10): Player[] {
  const state = loadState();
  const ps = Object.values(state.players);
  ps.sort((a, b) => b.score - a.score);
  return ps.slice(0, limit);
}
