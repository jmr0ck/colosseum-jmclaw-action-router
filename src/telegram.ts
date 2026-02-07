#!/usr/bin/env node

import { readFileSync } from 'node:fs';

import { Bot, InlineKeyboard } from 'grammy';

import { analyzeAction } from './analyze.js';
import { resolveToActionUrl } from './resolve.js';
import { getUserPrefs, setUserWallet } from './userstore.js';
import { getCallbackPayload, putCallbackPayload } from './callbackStore.js';
import { formatEli5, formatReceipts, formatShare, formatShort } from './present.js';
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
      'Paste ANY Solana link. BlinkGuard will try to find the underlying Action (actions.json / dial.to / solana-action) and simulate it.',
      '',
      'Commands:',
      '/setwallet <pubkey> — set your wallet address for simulation',
      '/play               — start the "Rug or Real" mini-game',
      '/lb                 — leaderboard',
      '/me                 — your stats',
      '/help',
      '',
      'Notes:',
      '- simulate-only (no transactions are sent)',
    ].join('\n'),
    { link_preview_options: { is_disabled: true } },
  );
});

// program labels now live in receipts formatting (src/present.ts)
// (program label helper moved to receipts view elsewhere)

function formatReport(report: any, opts?: { preface?: string }): string {
  // legacy wrapper; default to short CT-friendly view
  const parts: string[] = [];
  if (opts?.preface) parts.push(opts.preface);
  parts.push(formatShort(report));
  return parts.join('\n\n');
}

async function analyzeAndReply(ctx: any, actionUrl: string, rpcUrl = DEFAULT_RPC) {
  const policy = {
    requireApproval: true,
  };

  const uid = ctx.from?.id;
  const prefs = uid ? getUserPrefs(uid) : {};
  const postBody = prefs.wallet ? { account: prefs.wallet } : {};

  const report = await analyzeAction({ actionUrlArg: actionUrl, rpcUrl, policy, postBody });

  // store payload for short callback_data
  const cbId = putCallbackPayload({ actionUrl, rpcUrl });

  const kb = new InlineKeyboard();
  kb.text('Explain (ELI5)', `ui|eli5|${cbId}`);
  kb.text('Receipts', `ui|receipts|${cbId}`);
  kb.text('Share', `ui|share|${cbId}`);

  kb.row();
  kb.text('Re-run mainnet', `ui|rerun|mainnet|${cbId}`);
  kb.text('Re-run devnet', `ui|rerun|devnet|${cbId}`);

  // mini-game buttons
  kb.row();
  kb.text('✅ REAL', `ui|guess|REAL|${cbId}`);
  kb.text('🚩 RUG', `ui|guess|RUG|${cbId}`);
  kb.text('🤷 IDK', `ui|guess|IDK|${cbId}`);

  const needsWalletHint = !prefs.wallet ? '\n\nTip: set a wallet for better simulations: /setwallet <pubkey>' : '';

  await ctx.reply(formatReport(report) + needsWalletHint, {
    reply_markup: kb,
    link_preview_options: { is_disabled: true },
  });
}

bot.command('setwallet', async (ctx) => {
  const uid = ctx.from?.id;
  if (!uid) return;
  const parts = ctx.message?.text?.trim().split(/\s+/) ?? [];
  const wallet = parts[1];
  if (!wallet) {
    await ctx.reply('Usage: /setwallet <your Solana public key>', {
      link_preview_options: { is_disabled: true },
    });
    return;
  }
  setUserWallet(uid, wallet);
  await ctx.reply(`Saved. I will use this wallet for simulation: ${wallet}`, {
    link_preview_options: { is_disabled: true },
  });
});

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

  const tokens = txt.split(/\s+/).filter(Boolean);
  const urls = tokens.filter((t) => /^https?:\/\//i.test(t) || t.startsWith('solana-action:') || t.includes('dial.to'));

  // Batch mode: if they pasted multiple links, rank them.
  if (urls.length >= 2) {
    await ctx.reply(`Batch mode: scanning ${Math.min(urls.length, 5)} links…`, {
      link_preview_options: { is_disabled: true },
    });

    const uid = ctx.from?.id;
    const prefs = uid ? getUserPrefs(uid) : {};
    const postBody = prefs.wallet ? { account: prefs.wallet } : {};

    const results: Array<{ input: string; actionUrl?: string; score: number; verdict: string; why: string }> = [];

    for (const u of urls.slice(0, 5)) {
      try {
        const resolved = await resolveToActionUrl(u);
        if (resolved.kind !== 'action') {
          results.push({ input: u, score: 50, verdict: '🟡 MID', why: 'no Action found (actions.json missing?)' });
          continue;
        }

        const report = await analyzeAction({
          actionUrlArg: resolved.actionUrl,
          rpcUrl: DEFAULT_RPC,
          policy: { requireApproval: true },
          postBody,
        });

        const { score, signals } = scoreRisk(report);
        const v = verdictFromScore(score);
        const verdictWord = v === 'RUG' ? '🚩 RUG' : v === 'MID' ? '🟡 MID' : '✅ REAL';
        const why = signals.filter((s) => s.code !== 'CLEAN').slice(0, 1)[0]?.message ?? 'no obvious flags';

        results.push({ input: u, actionUrl: resolved.actionUrl, score, verdict: verdictWord, why });
      } catch {
        results.push({ input: u, score: 60, verdict: '🟡 MID', why: 'error fetching' });
      }
    }

    results.sort((a, b) => b.score - a.score);

    const lines = results.map((r, i) => `${i + 1}) ${r.verdict} (${r.score}/100) — ${r.why}\n   ${r.input}`);
    await ctx.reply(['🧪 Batch results (highest risk first)', ...lines].join('\n\n'), {
      link_preview_options: { is_disabled: true },
    });
    return;
  }

  const first = urls[0] ?? txt;

  await ctx.reply('👀 gimme the link… sim-only, no send. (Tip: /setwallet <pubkey> for real sims)', {
    link_preview_options: { is_disabled: true },
  });

  try {
    const resolved = await resolveToActionUrl(first);
    if (resolved.kind !== 'action') {
      await ctx.reply(
        `Couldn’t find a Solana Action behind that link. Paste a blink (dial.to) or any Solana page with actions.json.\nLink: ${first}`,
        { link_preview_options: { is_disabled: true } },
      );
      return;
    }
    await analyzeAndReply(ctx, resolved.actionUrl);
  } catch (e: any) {
    await ctx.reply(`Error: ${String(e?.message ?? e)}`);
  }
});

bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const parts = data.split('|');

  if (parts[0] !== 'ui') return;

  const action = parts[1];

  if (action === 'rerun') {
    const net = parts[2];
    const cbId = parts[3];
    const payload = getCallbackPayload(cbId);
    if (!payload) {
      await ctx.answerCallbackQuery({ text: 'expired. paste link again.' });
      return;
    }

    const rpcUrl = net === 'devnet' ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com';
    await ctx.answerCallbackQuery({ text: `Re-running on ${net}…` });

    try {
      await analyzeAndReply(ctx, payload.actionUrl, rpcUrl);
    } catch (e: any) {
      await ctx.reply(`Error: ${String(e?.message ?? e)}`);
    }
    return;
  }

  if (action === 'eli5' || action === 'receipts' || action === 'share') {
    const cbId = parts[2];
    const payload = getCallbackPayload(cbId);
    if (!payload) {
      await ctx.answerCallbackQuery({ text: 'expired. paste link again.' });
      return;
    }

    await ctx.answerCallbackQuery({ text: action === 'share' ? 'copy-paste this 👇' : 'ok' });

    try {
      const prefs = ctx.from?.id ? getUserPrefs(ctx.from.id) : {};
      const postBody = prefs.wallet ? { account: prefs.wallet } : {};

      const report = await analyzeAction({
        actionUrlArg: payload.actionUrl,
        rpcUrl: payload.rpcUrl,
        policy: { requireApproval: true },
        postBody,
      });

      const text =
        action === 'eli5'
          ? formatEli5(report)
          : action === 'receipts'
            ? formatReceipts(report)
            : formatShare(report);

      await ctx.reply(text, { link_preview_options: { is_disabled: true } });
    } catch (e: any) {
      await ctx.reply(`Error: ${String(e?.message ?? e)}`);
    }
    return;
  }

  if (action === 'guess') {
    const guess = parts[2] as 'REAL' | 'RUG' | 'IDK';
    const cbId = parts[3];
    const payload = getCallbackPayload(cbId);
    if (!payload) {
      await ctx.answerCallbackQuery({ text: 'expired. paste link again.' });
      return;
    }

    await ctx.answerCallbackQuery({ text: `Locking in: ${guess}` });

    try {
      const prefs = ctx.from?.id ? getUserPrefs(ctx.from.id) : {};
      const postBody = prefs.wallet ? { account: prefs.wallet } : {};

      const report = await analyzeAction({
        actionUrlArg: payload.actionUrl,
        rpcUrl: payload.rpcUrl,
        policy: { requireApproval: true },
        postBody,
      });
      const { score } = scoreRisk(report);
      const verdict = verdictFromScore(score);

      const correct = guess !== 'IDK' && guess === verdict;
      const base = 10;
      const bonus = verdict === 'RUG' && report.simulation?.ok === false ? 5 : 0;

      const p = recordRound({
        userId: ctx.from!.id,
        correct,
        basePoints: base,
        bonusPoints: bonus,
      });

      const preface = correct
        ? `✅ good call, anon. +${base + bonus} (streak bonus applies once/day).\nScore: ${p.score} | streak: ${p.streak} | rounds: ${p.rounds}`
        : `💀 you got farmed. (streak bonus applies once/day).\nScore: ${p.score} | streak: ${p.streak} | rounds: ${p.rounds}`;

      await ctx.reply(preface + '\n\n' + formatShort(report), {
        link_preview_options: { is_disabled: true },
      });
    } catch (e: any) {
      await ctx.reply(`Error: ${String(e?.message ?? e)}`);
    }
    return;
  }
});

bot.start();
