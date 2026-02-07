#!/usr/bin/env node

import { readFileSync } from 'node:fs';

import { createXClient, loadXCredsFromEnv } from './xClient.js';

function usage() {
  console.log(`Usage:
  npm run x:whoami
  npm run x:tweet -- "text"
  npm run x:reply -- <tweetIdOrUrl> "text"
`);
}

function getArgText(startIdx: number) {
  return process.argv.slice(startIdx).join(' ').trim();
}

function parseTweetId(input: string) {
  const m = input.match(/status\/(\d+)/);
  return m ? m[1] : input;
}

async function main() {
  const cmd = process.argv[2];
  if (!cmd) {
    usage();
    process.exit(1);
  }

  const client = createXClient(loadXCredsFromEnv());

  if (cmd === 'whoami') {
    const me = await client.v2.me();
    console.log(JSON.stringify(me, null, 2));
    return;
  }

  if (cmd === 'tweet') {
    const text = getArgText(3);
    if (!text) throw new Error('Missing tweet text');
    const r = await client.v2.tweet(text);
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (cmd === 'reply') {
    const target = process.argv[3];
    const text = getArgText(4);
    if (!target || !text) throw new Error('Usage: reply <tweetIdOrUrl> "text"');
    const tweetId = parseTweetId(target);
    const r = await client.v2.reply(text, tweetId);
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (cmd === 'pin') {
    const userId = process.env.X_USER_ID;
    const tweetId = process.argv[3];
    if (!userId) throw new Error('Missing X_USER_ID env var');
    if (!tweetId) throw new Error('Usage: pin <tweetId>');
    const r = await client.v2.post(`users/${userId}/pinned_tweets`, { tweet_id: tweetId });
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (cmd === 'tweet-media') {
    const text = process.argv[3] ?? '';
    const mediaPath = process.argv[4];
    if (!mediaPath) throw new Error('Usage: tweet-media "text" <mediaPath>');

    // Upload via v1.1 media endpoint
    const mediaId = await client.v1.uploadMedia(mediaPath);
    const r = await client.v2.tweet({ text, media: { media_ids: [mediaId] } });
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (cmd === 'loadenv') {
    // helper: prints exports for .secrets file (do not log secrets in chat)
    const p = process.argv[3];
    if (!p) throw new Error('Usage: loadenv <path>');
    const raw = readFileSync(p, 'utf8');
    console.log(raw);
    return;
  }

  usage();
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
