#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { z } from 'zod';

import { analyzeAction } from './analyze.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const AnalyzeSchema = z.object({
  actionUrl: z.string().min(1),
  rpcUrl: z.string().url().optional(),
  policy: z
    .object({
      maxSol: z.number().optional(),
      allowPrograms: z.array(z.string()).optional(),
      denyPrograms: z.array(z.string()).optional(),
      denyMints: z.array(z.string()).optional(),
      requireApproval: z.boolean().optional(),
    })
    .passthrough()
    .optional(),
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/analyze', async (req, res) => {
  const parsed = AnalyzeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.flatten() });
    return;
  }

  const { actionUrl, rpcUrl, policy } = parsed.data;

  const report = await analyzeAction({
    actionUrlArg: actionUrl,
    rpcUrl: rpcUrl ?? 'https://api.mainnet-beta.solana.com',
    policy,
  });

  res.json({ ok: true, report });
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});
