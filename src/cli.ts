#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Policy = {
  maxSol?: number;
  allowPrograms?: string[];
  denyMints?: string[];
};

function usage() {
  console.log(`Usage:
  npm run dev -- <actionUrl> [--policy policy.yml]

Examples:
  npm run dev -- "solana-action:https://example.com/api/action"
  npm run dev -- "https://dial.to/?action=solana-action%3Ahttps%3A%2F%2Fexample.com%2Faction" --policy policy.yml
`);
}

function getArg(flag: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function stripActionUrl(input: string): string {
  // Accept:
  // - solana-action:https://...
  // - https://dial.to/?action=<urlencoded solana-action:...>
  // - https://example/?action=<...>
  if (input.startsWith('solana-action:')) return input.replace(/^solana-action:/, '');

  try {
    const u = new URL(input);
    const action = u.searchParams.get('action');
    if (action) {
      const decoded = decodeURIComponent(action);
      if (decoded.startsWith('solana-action:')) return decoded.replace(/^solana-action:/, '');
      return decoded;
    }
  } catch {}

  return input;
}

async function main() {
  const actionUrlArg = process.argv[2];
  if (!actionUrlArg || actionUrlArg.startsWith('-')) {
    usage();
    process.exit(1);
  }

  const policyPath = getArg('--policy');
  let policy: Policy = {};
  if (policyPath) {
    // lazy YAML parse to avoid over-engineering; policy is optional
    const { parse } = await import('yaml');
    policy = parse(readFileSync(resolve(policyPath), 'utf8')) as Policy;
  }

  const actionUrl = stripActionUrl(actionUrlArg);

  console.log(JSON.stringify({ actionUrl, policy }, null, 2));
  console.log('\nMVP scaffold only: next step is implement Actions GET/POST + simulation + policy checks.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
