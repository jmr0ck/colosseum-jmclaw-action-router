import type { ActionGetResponse } from './types.js';

export function normalizeActionUrl(input: string): string {
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
  } catch {
    // ignore
  }
  return input;
}

export async function actionGet(actionUrl: string): Promise<ActionGetResponse> {
  const res = await fetch(actionUrl, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`GET ${actionUrl} failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as ActionGetResponse;
  return data;
}

export async function actionPost(
  endpoint: string,
  body: unknown,
): Promise<{ raw: any; txBase64?: string; endpoint?: string }> {
  const tryPost = async (url: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return res;
  };

  let res = await tryPost(endpoint);

  // Heuristic: some Action endpoints only work on a specific action href (from GET) and will 404 on the "index".
  // For Jupiter, GET works on /blinks/swap/USDC-SOL but POST must hit /blinks/swap/<mint>/<mint>/<amount>.
  if (res.status === 404) {
    try {
      const get = await fetch(endpoint, { method: 'GET', headers: { accept: 'application/json' } });
      if (get.ok) {
        const meta: any = await get.json();
        const href = meta?.links?.actions?.[0]?.href;
        if (typeof href === 'string') {
          const u = new URL(endpoint);
          const next = href.startsWith('http') ? href : `${u.origin}${href}`;
          res = await tryPost(next);
          endpoint = next;
        }
      }
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`POST ${endpoint} failed: ${res.status} ${res.statusText} ${txt}`);
  }
  const raw = await res.json();
  const txBase64 = raw?.transaction ?? raw?.tx ?? raw?.data?.transaction;
  return { raw, txBase64: typeof txBase64 === 'string' ? txBase64 : undefined, endpoint };
}
