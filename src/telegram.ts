#!/usr/bin/env node

import { readFileSync } from 'node:fs';

import { Bot, InlineKeyboard } from 'grammy';

import { analyzeAction } from './analyze.js';

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
      'Send me a Solana Action / Blink link (dial.to or solana-action:...) and I will:',
      '- fetch action metadata',
      '- extract touched programs',
      '- simulate on Solana (no sending)',
      '- return a risk/policy report',
      '',
      `Default RPC: ${DEFAULT_RPC}`,
    ].join('\n'),
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    [
      'Usage:',
      '- Paste a Blink/Action URL',
      '',
      'Commands:',
      '/start',
      '/help',
      '',
      'Notes:',
      '- simulation only (no transactions are sent)',
    ].join('\n'),
  );
});

function formatReport(report: any): string {
  const title = report?.get?.title ?? '(no title)';
  const desc = report?.get?.description ?? '';
  const touched = report?.tx?.touchedProgramIds ?? [];

  const simOk = report?.simulation?.ok;
  const simErr = report?.simulation?.err;

  const policyPassed = report?.policy?.passed;
  const policyReasons: string[] = report?.policy?.reasons ?? [];

  const topLogs: string[] = (report?.simulation?.logs ?? []).slice(0, 12);

  const lines: string[] = [];
  lines.push(`🛡️ BlinkGuard Report`);
  lines.push(`Title: ${title}`);
  if (desc) lines.push(`Desc: ${desc}`);
  lines.push(`URL: ${report.actionUrl}`);
  lines.push('');

  lines.push(`Touched programs (${touched.length}):`);
  if (touched.length) {
    for (const p of touched.slice(0, 12)) lines.push(`- ${p}`);
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

  lines.push('');
  lines.push(`Policy: ${policyPassed ? 'PASS' : 'FLAGGED'}`);
  if (policyReasons.length) {
    lines.push('Reasons:');
    for (const r of policyReasons) lines.push(`- ${r}`);
  }

  return lines.join('\n');
}

async function analyzeAndReply(ctx: any, actionUrl: string, rpcUrl = DEFAULT_RPC) {
  const policy = {
    // Conservative defaults for CT: always treat as report-only until we wire allowlists.
    requireApproval: true,
  };

  const report = await analyzeAction({ actionUrlArg: actionUrl, rpcUrl, policy });

  const kb = new InlineKeyboard().text('Re-run (mainnet)', `rerun|mainnet|${actionUrl}`);
  kb.text('Re-run (devnet)', `rerun|devnet|${actionUrl}`);

  await ctx.reply(formatReport(report), {
    reply_markup: kb,
    link_preview_options: { is_disabled: true },
  });
}

bot.on('message:text', async (ctx) => {
  const txt = ctx.message.text.trim();
  if (txt.startsWith('/')) return; // handled by commands

  // naive: treat first token as URL
  const first = txt.split(/\s+/)[0];

  await ctx.reply('Analyzing… (simulate only; no sending)', {
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
  if (parts[0] !== 'rerun') return;

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
});

bot.start();
