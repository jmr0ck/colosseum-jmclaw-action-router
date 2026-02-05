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
