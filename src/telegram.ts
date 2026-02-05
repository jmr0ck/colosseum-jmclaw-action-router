#!/usr/bin/env node

import { readFileSync } from 'node:fs';

import { Bot, InlineKeyboard } from 'grammy';

import { analyzeAction } from './analyze.js';
import { getPlayer, leaderboard, recordRound } from './game.js';
import { scoreRisk, verdictFromScore } from './risk.js';

function getToken(): string {
  const env = process.env.TELEGRAM_BOT_TOKEN;
  if (env && env.trim()) return env.trim();

  // Local dev convenience (NOT committed)
  try {
    return readFileSync('.secrets/telegram_blinkguard_token', 'utf8').trim();
  } catch {
    throw new Error('Missing TELEGRAM_BOT_TOKEN (or .secrets/telegram_blinkguard_token)');
  }
}

const DEFAULT_RPC = process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';

const bot = new Bot(getToken());

bot.command('start', async (ctx) => {
  await ctx.reply(
    [
      'BlinkGuard is live.',
      '',
      'Paste any Solana Blink/Action link (dial.to or solana-action:...). I will simulate it (no sending) and tell you if it looks REAL or RUGGY.',
      '',
      'Degenerate mode:',
      '- Play: /play',
      '- Leaderboard: /lb',
      '',
      `Default RPC: ${DEFAULT_RPC}`,
    ].join('\n'),
    { link_preview_options: { is_disabled: true } },
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    [
      'Send a Blink/Action URL and I will analyze it.',
      '',
      'Commands:',
      '/play  — start the "Rug or Real" mini-game',
      '/lb    — leaderboard',
      '/me    — your stats',
      '/help',
      '',
      'Notes:',
      '- simulate-only (no transactions are sent)',
    ].join('\n'),
    { link_preview_options: { is_disabled: true } },
  );
});

const PROGRAM_LABELS: Record<string, string> = {
  // core
  '11111111111111111111111111111111': 'System Program',
  'ComputeBudget111111111111111111111111111111': 'Compute Budget',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'SPL Token',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Account',
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr': 'Memo',
};

function fmtProgram(p: string) {
  const label = PROGRAM_LABELS[p];
  return label ? `${p} (${label})` : p;
}

function formatReport(report: any, opts?: { preface?: string }): string {
  const title = report?.get?.title ?? '(no title)';
  const desc = report?.get?.description ?? '';
  const touched: string[] = report?.tx?.touchedProgramIds ?? [];

  const simOk = report?.simulation?.ok;
  const simErr = report?.simulation?.err;

  const { score, signals } = scoreRisk(report);
  const verdict = verdictFromScore(score);

  const topLogs: string[] = (report?.simulation?.logs ?? []).slice(0, 8);

  const lines: string[] = [];
  if (opts?.preface) lines.push(opts.preface);

  const verdictWord = verdict === 'RUG' ? '🚩 RUGGY' : verdict === 'MID' ? '🟡 MID' : '✅ REAL-ish';
  lines.push(`🛡️ BlinkGuard verdict: ${verdictWord} (risk ${score}/100)`);
  lines.push(`Title: ${title}`);
  if (desc) lines.push(`Desc: ${desc}`);
  lines.push(`URL: ${report.actionUrl}`);

  lines.push('');
  lines.push('Why:');
  for (const s of signals.slice(0, 5)) {
    lines.push(`- [${s.severity}] ${s.message}`);
  }

  lines.push('');
  lines.push(`Touched programs (${touched.length}):`);
  if (touched.length) {
    for (const p of touched.slice(0, 12)) lines.push(`- ${fmtProgram(p)}`);
    if (touched.length > 12) lines.push(`- ... (+${touched.length - 12} more)`);
  } else {
    lines.push('- (none detected)');
  }

  lines.push('');
  lines.push(`Simulation: ${simOk ? 'OK' : 'FAIL'}`);
  if (!simOk && simErr) lines.push(`Sim err: ${simErr}`);

  if (topLogs.length) {
    lines.push('');
    lines.push('Top logs:');
    for (const l of topLogs) lines.push(`- ${l}`);
  }

  return lines.join('\n');
}

async function analyzeAndReply(ctx: any, actionUrl: string, rpcUrl = DEFAULT_RPC) {
  const policy = {
    // Conservative defaults: report-only.
    requireApproval: true,
  };

  const report = await analyzeAction({ actionUrlArg: actionUrl, rpcUrl, policy });

  const kb = new InlineKeyboard().text('Re-run (mainnet)', `rerun|mainnet|${actionUrl}`);
  kb.text('Re-run (devnet)', `rerun|devnet|${actionUrl}`);

  // mini-game buttons
  kb.row();
  kb.text('✅ REAL', `guess|REAL|${rpcUrl}|${actionUrl}`);
  kb.text('🚩 RUG', `guess|RUG|${rpcUrl}|${actionUrl}`);
  kb.text('🤷 IDK', `guess|IDK|${rpcUrl}|${actionUrl}`);

  await ctx.reply(formatReport(report), {
    reply_markup: kb,
    link_preview_options: { is_disabled: true },
  });
}

bot.command('play', async (ctx) => {
  const uid = ctx.from?.id;
  if (!uid) return;
  const p = getPlayer(uid);
  await ctx.reply(
    [
      "🎰 Rug or Real (Blink Edition)",
      '',
      'Paste a Blink link. Then smash a guess button:',
      '✅ REAL / 🚩 RUG / 🤷 IDK',
      '',
      `Your score: ${p.score} | streak: ${p.streak} | rounds: ${p.rounds}`,
      '',
      'Rules (MVP):',
      '- correct guess: +10',
      '- bonus: +5 if it’s RUGGY + sim fails',
      '- streak: +2/day (caps)',
    ].join('\n'),
    { link_preview_options: { is_disabled: true } },
  );
});

bot.command('me', async (ctx) => {
  const uid = ctx.from?.id;
  if (!uid) return;
  const p = getPlayer(uid);
  await ctx.reply(`You: score ${p.score} | streak ${p.streak} | rounds ${p.rounds}`, {
    link_preview_options: { is_disabled: true },
  });
});

bot.command('lb', async (ctx) => {
  const top = leaderboard(10);
  const lines = top.map((p, i) => `${i + 1}. ${p.score} pts — user ${p.userId} (streak ${p.streak})`);
  await ctx.reply(['🏆 BlinkGuard degen leaderboard', ...lines].join('\n'), {
    link_preview_options: { is_disabled: true },
  });
});

bot.on('message:text', async (ctx) => {
  const txt = ctx.message.text.trim();
  if (txt.startsWith('/')) return;

  const first = txt.split(/\s+/)[0];

  await ctx.reply('Analyzing… (simulate-only). Place your degen bet in ~5s.', {
    link_preview_options: { is_disabled: true },
  });

  try {
    await analyzeAndReply(ctx, first);
  } catch (e: any) {
    await ctx.reply(`Error: ${String(e?.message ?? e)}`);
  }
});

bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const parts = data.split('|');

  if (parts[0] === 'rerun') {
    const net = parts[1];
    const actionUrl = parts.slice(2).join('|');

    const rpcUrl =
      net === 'devnet' ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com';

    await ctx.answerCallbackQuery({ text: `Re-running on ${net}…` });

    try {
      await analyzeAndReply(ctx, actionUrl, rpcUrl);
    } catch (e: any) {
      await ctx.reply(`Error: ${String(e?.message ?? e)}`);
    }
    return;
  }

  if (parts[0] === 'guess') {
    const guess = parts[1] as 'REAL' | 'RUG' | 'IDK';
    const rpcUrl = parts[2];
    const actionUrl = parts.slice(3).join('|');

    await ctx.answerCallbackQuery({ text: `Locking in: ${guess}` });

    try {
      const report = await analyzeAction({
        actionUrlArg: actionUrl,
        rpcUrl,
        policy: { requireApproval: true },
      });
      const { score } = scoreRisk(report);
      const verdict = verdictFromScore(score);

      const correct = guess !== 'IDK' && guess === verdict;
      const base = 10;
      const bonus = verdict === 'RUG' && report.simulation?.ok === false ? 5 : 0;

      const p = recordRound({
        userId: ctx.from.id,
        correct,
        basePoints: base,
        bonusPoints: bonus,
      });

      const preface = correct
        ? `✅ good call, anon. +${base + bonus} (streak bonus applied if first play today).\nYour score: ${p.score} | streak: ${p.streak} | rounds: ${p.rounds}`
        : `💀 you got farmed. (streak bonus still applies once/day).\nYour score: ${p.score} | streak: ${p.streak} | rounds: ${p.rounds}`;

      await ctx.reply(formatReport(report, { preface }), {
        link_preview_options: { is_disabled: true },
      });
    } catch (e: any) {
      await ctx.reply(`Error: ${String(e?.message ?? e)}`);
    }
    return;
  }
});

bot.start();
