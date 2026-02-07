import { normalizeActionUrl } from './actions.js';

export type ResolvedInput =
  | { kind: 'action'; actionUrl: string; source: 'solana-action' | 'dial' | 'direct' }
  | { kind: 'url'; url: string; source: 'plain' };

// Try to turn whatever the user pasted into an Action URL.
export async function resolveToActionUrl(input: string): Promise<ResolvedInput> {
  const trimmed = input.trim();

  // 1) dial.to/?action=... or solana-action:... or direct action endpoint
  const normalized = normalizeActionUrl(trimmed);
  if (normalized !== trimmed || looksLikeActionEndpoint(normalized)) {
    return {
      kind: 'action',
      actionUrl: normalized,
      source: trimmed.startsWith('solana-action:')
        ? 'solana-action'
        : trimmed.includes('dial.to')
          ? 'dial'
          : 'direct',
    };
  }

  // 2) plain URL -> attempt actions.json mapping
  try {
    const u = new URL(trimmed);
    const actionUrl = await resolveViaActionsJson(u);
    if (actionUrl) {
      return { kind: 'action', actionUrl, source: 'plain' as any };
    }
    return { kind: 'url', url: trimmed, source: 'plain' };
  } catch {
    // not a URL
    return { kind: 'url', url: trimmed, source: 'plain' };
  }
}

function looksLikeActionEndpoint(url: string) {
  // Heuristic: many Action endpoints are under /api/actions or /blinks.
  return url.includes('/api/actions') || url.includes('/blinks/') || url.includes('/actions/');
}

type ActionsJson = {
  rules?: Array<{ pathPattern: string; apiPath: string }>;
};

function matchPattern(path: string, pattern: string): boolean {
  // Very small glob matcher for patterns like /swap/**
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return path.startsWith(prefix);
  }
  return path === pattern;
}

function applyApiPath(path: string, rule: { pathPattern: string; apiPath: string }, origin: string): string {
  // apiPath may include ** placeholder
  if (rule.apiPath.includes('**')) {
    const prefix = rule.pathPattern.endsWith('/**') ? rule.pathPattern.slice(0, -3) : rule.pathPattern;
    const rest = path.startsWith(prefix) ? path.slice(prefix.length) : '';
    return rule.apiPath.replace('**', rest.replace(/^\//, ''))
      // preserve leading slash behavior
      .replace(/(?<!:)\/{2,}/g, '/');
  }

  // Some rules use relative API paths
  if (rule.apiPath.startsWith('/')) return origin + rule.apiPath;
  return rule.apiPath;
}

async function resolveViaActionsJson(u: URL): Promise<string | null> {
  const actionsJsonUrl = `${u.origin}/actions.json`;
  const res = await fetch(actionsJsonUrl, { headers: { accept: 'application/json' } }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = (await res.json().catch(() => null)) as ActionsJson | null;
  if (!data?.rules?.length) return null;

  const path = u.pathname;
  for (const rule of data.rules) {
    if (!rule.pathPattern || !rule.apiPath) continue;
    if (matchPattern(path, rule.pathPattern)) {
      const actionUrl = applyApiPath(path, rule, u.origin);
      return actionUrl;
    }
  }
  return null;
}
