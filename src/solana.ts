import { createSolanaRpc } from '@solana/kit';

// Minimal RPC wrapper for now.
export function getRpc(rpcUrl: string) {
  return createSolanaRpc(rpcUrl);
}
