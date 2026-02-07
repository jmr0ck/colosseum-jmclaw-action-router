#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { xaiImageGenerate } from './xai.js';

function usage() {
  console.log(`Usage:
  npm run xai:image -- "prompt" [--out out.jpg] [--ratio 1:1]

Env:
  XAI_API_KEY (required)
  XAI_BASE_URL (optional, default https://api.x.ai)
`);
}

function getArg(flag: string) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

async function main() {
  const prompt = process.argv[2];
  if (!prompt || prompt.startsWith('-')) {
    usage();
    process.exit(1);
  }

  const out = getArg('--out') ?? `.data/media/xai_${Date.now()}.jpg`;
  const ratio = getArg('--ratio') ?? '1:1';

  const { bytes, mimeType } = await xaiImageGenerate({
    prompt,
    model: process.env.XAI_IMAGE_MODEL ?? 'grok-imagine-image',
    aspect_ratio: ratio,
    image_format: 'base64',
  });

  mkdirSync(resolve(out, '..'), { recursive: true });
  writeFileSync(resolve(out), Buffer.from(bytes));

  console.log(JSON.stringify({ ok: true, out, mimeType, bytes: bytes.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
