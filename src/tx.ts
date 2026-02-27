import {
  Connection,
  PublicKey,
  VersionedTransaction,
  type AddressLookupTableAccount,
} from '@solana/web3.js';

export function decodeVersionedTransactionFromBase64(txBase64: string): VersionedTransaction {
  const bytes = Buffer.from(txBase64, 'base64');
  return VersionedTransaction.deserialize(bytes);
}

export async function fetchLookupTableAccounts(opts: {
  connection: Connection;
  tx: VersionedTransaction;
}): Promise<AddressLookupTableAccount[]> {
  const { connection, tx } = opts;

  const lookups = tx.message.addressTableLookups ?? [];
  if (lookups.length === 0) return [];

  const tables: AddressLookupTableAccount[] = [];
  for (const lookup of lookups) {
    const key = new PublicKey(lookup.accountKey);
    const res = await connection.getAddressLookupTable(key);
    if (res?.value) tables.push(res.value);
  }
  return tables;
}

export function getAllAccountKeys(tx: VersionedTransaction, lookupTables: AddressLookupTableAccount[]) {
  // For v0 txs with ALTs, programIdIndex and account indices refer to the
  // *resolved* account list (static + loaded).
  // web3.js provides getAccountKeys for this.
  //
  // If there are no lookup tables, this still works and returns static keys.
  return tx.message.getAccountKeys({ addressLookupTableAccounts: lookupTables });
}

export function extractTouchedProgramIds(opts: {
  tx: VersionedTransaction;
  lookupTables: AddressLookupTableAccount[];
}): string[] {
  const { tx, lookupTables } = opts;

  const keys = getAllAccountKeys(tx, lookupTables);
  const out = new Set<string>();

  for (const ix of tx.message.compiledInstructions) {
    const programKey = keys.get(ix.programIdIndex);
    if (programKey) out.add(programKey.toBase58());
  }

  return [...out];
}

// --- Intent parsing (best-effort, minimal decoders) ---

export type IntentInstruction = {
  programId: string;
  program: 'system' | 'spl-token' | 'unknown';
  kind: string;
  amount?: string; // raw integer units
  mint?: string;
  from?: string;
  to?: string;
  authority?: string;
  details?: string;
};

export type IntentSummary = {
  instructions: IntentInstruction[];
  warnings: string[];
};

const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

function readU64LE(buf: Buffer, offset: number): bigint {
  // Node supports readBigUInt64LE
  return buf.readBigUInt64LE(offset);
}

function readU32LE(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

function isMaxU64(x: bigint) {
  return x === 18446744073709551615n;
}

export function extractIntentSummary(opts: {
  tx: VersionedTransaction;
  lookupTables: AddressLookupTableAccount[];
}): IntentSummary {
  const { tx, lookupTables } = opts;
  const keys = getAllAccountKeys(tx, lookupTables);

  const instructions: IntentInstruction[] = [];
  const warnings: string[] = [];

  for (const ix of tx.message.compiledInstructions) {
    const programKey = keys.get(ix.programIdIndex);
    const programId = programKey?.toBase58() ?? '';

    const accountKeys = ix.accountKeyIndexes.map((i) => keys.get(i)?.toBase58()).filter(Boolean) as string[];
    const data = Buffer.from(ix.data);

    // System program: u32 discriminator + payload
    if (programId === SYSTEM_PROGRAM && data.length >= 4) {
      const disc = readU32LE(data, 0);
      if (disc === 2 && data.length >= 12 && accountKeys.length >= 2) {
        const lamports = readU64LE(data, 4);
        instructions.push({
          programId,
          program: 'system',
          kind: 'transfer',
          amount: lamports.toString(),
          from: accountKeys[0],
          to: accountKeys[1],
          details: `${lamports.toString()} lamports`,
        });
      } else {
        instructions.push({ programId, program: 'system', kind: `system_ix_${disc}` });
      }
      continue;
    }

    // SPL token program: first byte is instruction
    if (programId === TOKEN_PROGRAM && data.length >= 1) {
      const disc = data.readUInt8(0);
      // Approve (4) layout: u8 + u64 amount
      if (disc === 4 && data.length >= 9 && accountKeys.length >= 3) {
        const amount = readU64LE(data, 1);
        const from = accountKeys[0]; // source token account
        const to = accountKeys[1]; // delegate
        const authority = accountKeys[2];

        const instr: IntentInstruction = {
          programId,
          program: 'spl-token',
          kind: 'approve',
          amount: amount.toString(),
          from,
          to,
          authority,
          details: isMaxU64(amount) ? 'unlimited approval' : `approve ${amount.toString()}`,
        };
        instructions.push(instr);
        if (isMaxU64(amount)) warnings.push('UNLIMITED_TOKEN_APPROVAL');
        continue;
      }

      // Transfer (3): u8 + u64 amount
      if (disc === 3 && data.length >= 9 && accountKeys.length >= 3) {
        const amount = readU64LE(data, 1);
        instructions.push({
          programId,
          program: 'spl-token',
          kind: 'transfer',
          amount: amount.toString(),
          from: accountKeys[0],
          to: accountKeys[1],
          authority: accountKeys[2],
        });
        continue;
      }

      // TransferChecked (12): u8 + u64 amount + u8 decimals
      if (disc === 12 && data.length >= 10 && accountKeys.length >= 4) {
        const amount = readU64LE(data, 1);
        const decimals = data.readUInt8(9);
        instructions.push({
          programId,
          program: 'spl-token',
          kind: 'transferChecked',
          amount: amount.toString(),
          mint: accountKeys[2],
          from: accountKeys[0],
          to: accountKeys[1],
          authority: accountKeys[3],
          details: `decimals=${decimals}`,
        });
        continue;
      }

      // SetAuthority (17): u8 + u8 authorityType + (optional new authority pubkey)
      if (disc === 17 && data.length >= 2 && accountKeys.length >= 2) {
        const authorityType = data.readUInt8(1);
        // If remaining data is 32 bytes, it's new authority pubkey; if 0, it's None.
        const newAuth = data.length >= 34 ? new PublicKey(data.subarray(2, 34)).toBase58() : undefined;
        instructions.push({
          programId,
          program: 'spl-token',
          kind: 'setAuthority',
          from: accountKeys[0],
          authority: accountKeys[1],
          to: newAuth,
          details: `authorityType=${authorityType}${newAuth ? '' : ' (cleared)'}`,
        });
        warnings.push('TOKEN_AUTHORITY_CHANGE');
        continue;
      }

      instructions.push({ programId, program: 'spl-token', kind: `token_ix_${disc}` });
      continue;
    }

    instructions.push({ programId, program: 'unknown', kind: 'unknown' });
  }

  return { instructions, warnings };
}
