export type Policy = {
  maxSol?: number; // max SOL allowed to spend (best-effort, parsed from tx)
  allowPrograms?: string[]; // allowlist of program IDs (base58)
  denyPrograms?: string[]; // denylist of program IDs
  denyMints?: string[]; // denylist of SPL token mints (base58)
  requireApproval?: boolean; // if true, never execute; only produce report
};

export type ActionGetResponse = {
  title?: string;
  icon?: string;
  description?: string;
  label?: string;
  disabled?: boolean;
  error?: { message: string };
  links?: {
    actions?: Array<{ label: string; href: string }>;
  };
};

export type RouterReport = {
  actionUrl: string;
  fetchedAt: string;
  get: ActionGetResponse | null;
  post: {
    endpoint: string;
    ok: boolean;
    error?: string;
  };
  tx: {
    encoding: 'base64' | 'unknown';
    lengthBytes?: number;
    // Note: an Action tx may be partially-signed or unsigned; signature may be absent/invalid.
    signature?: string;
    touchedProgramIds?: string[];
  } | null;
  simulation?: {
    ok: boolean;
    err?: string;
    logs?: string[];
  };
  policy: {
    passed: boolean;
    reasons: string[];
  };
};
