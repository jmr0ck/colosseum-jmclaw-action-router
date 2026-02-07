export type XaiConfig = {
  apiKey: string;
  baseUrl: string;
};

export function loadXaiConfigFromEnv(): XaiConfig {
  const apiKey = process.env.XAI_API_KEY;
  const baseUrl = process.env.XAI_BASE_URL ?? 'https://api.x.ai';
  if (!apiKey) throw new Error('Missing XAI_API_KEY');
  return { apiKey, baseUrl };
}

export async function xaiImageGenerate(opts: {
  prompt: string;
  model: string;
  aspect_ratio?: string;
  image_format?: 'base64';
}): Promise<{ mimeType: string; bytes: Uint8Array; raw: any }> {
  const { prompt, model } = opts;
  const { apiKey, baseUrl } = loadXaiConfigFromEnv();

  const url = `${baseUrl}/v1/images/generations`;

  // Try xAI-native params first.
  const bodyA: any = {
    model,
    prompt,
    aspect_ratio: opts.aspect_ratio ?? '1:1',
    image_format: opts.image_format ?? 'base64',
  };

  const doReq = async (body: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const rawText = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(rawText);
    } catch {
      // keep as text
    }
    if (!res.ok) {
      throw new Error(`xAI image generation failed: ${res.status} ${res.statusText} ${rawText}`);
    }
    return json;
  };

  let raw: any;
  try {
    raw = await doReq(bodyA);
  } catch {
    // Fallback to OpenAI-compat style.
    const bodyB: any = {
      model,
      prompt,
      size: '1024x1024',
      response_format: 'b64_json',
    };
    raw = await doReq(bodyB);
  }

  // Parse common response shapes.
  // - OpenAI compat: { data: [{ b64_json: "..." }] }
  // - xAI often returns: { data: [{ url: "https://...jpeg" }] }
  let b64: string | undefined;
  let urlOut: string | undefined;
  let mimeType = 'image/jpeg';

  if (typeof raw?.image === 'string') {
    b64 = raw.image;
    mimeType = raw?.mime_type ?? raw?.mimeType ?? mimeType;
  } else if (Array.isArray(raw?.data) && typeof raw.data?.[0]?.b64_json === 'string') {
    b64 = raw.data[0].b64_json;
    mimeType = raw.data?.[0]?.mime_type ?? mimeType;
  } else if (typeof raw?.data?.[0]?.image === 'string') {
    b64 = raw.data[0].image;
    mimeType = raw.data?.[0]?.mime_type ?? mimeType;
  } else if (typeof raw?.data?.[0]?.url === 'string') {
    urlOut = raw.data[0].url;
  }

  if (b64) {
    const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
    return { mimeType, bytes, raw };
  }

  if (urlOut) {
    const r = await fetch(urlOut);
    if (!r.ok) throw new Error(`Failed to download generated image: ${r.status} ${r.statusText}`);
    const ab = await r.arrayBuffer();
    const ct = r.headers.get('content-type');
    if (ct) mimeType = ct;
    return { mimeType, bytes: new Uint8Array(ab), raw };
  }

  throw new Error(`xAI image generation response missing image data. keys: ${Object.keys(raw ?? {}).join(',')}`);
}
