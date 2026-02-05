export function normalizeActionUrl(input) {
    // Accept:
    // - solana-action:https://...
    // - https://dial.to/?action=<urlencoded solana-action:...>
    // - https://example/?action=<...>
    if (input.startsWith('solana-action:'))
        return input.replace(/^solana-action:/, '');
    try {
        const u = new URL(input);
        const action = u.searchParams.get('action');
        if (action) {
            const decoded = decodeURIComponent(action);
            if (decoded.startsWith('solana-action:'))
                return decoded.replace(/^solana-action:/, '');
            return decoded;
        }
    }
    catch {
        // ignore
    }
    return input;
}
export async function actionGet(actionUrl) {
    const res = await fetch(actionUrl, {
        method: 'GET',
        headers: {
            accept: 'application/json',
        },
    });
    if (!res.ok)
        throw new Error(`GET ${actionUrl} failed: ${res.status} ${res.statusText}`);
    const data = (await res.json());
    return data;
}
export async function actionPost(endpoint, body) {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`POST ${endpoint} failed: ${res.status} ${res.statusText} ${txt}`);
    }
    const raw = await res.json();
    // Best-effort: many action implementations return { transaction: <base64> }
    const txBase64 = raw?.transaction ?? raw?.tx ?? raw?.data?.transaction;
    return { raw, txBase64: typeof txBase64 === 'string' ? txBase64 : undefined };
}
