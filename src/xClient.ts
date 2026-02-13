import { TwitterApi } from 'twitter-api-v2';

export type XCreds = {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};

export function loadXCredsFromEnv(): XCreds {
  // Support both naming conventions:
  // - X_CONSUMER_KEY / X_CONSUMER_SECRET (preferred)
  // - X_API_KEY / X_API_SECRET (common in X dev portal)
  const consumerKey = process.env.X_CONSUMER_KEY ?? process.env.X_API_KEY;
  const consumerSecret = process.env.X_CONSUMER_SECRET ?? process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  const missing = [
    !consumerKey && 'X_CONSUMER_KEY(or X_API_KEY)',
    !consumerSecret && 'X_CONSUMER_SECRET(or X_API_SECRET)',
    !accessToken && 'X_ACCESS_TOKEN',
    !accessTokenSecret && 'X_ACCESS_TOKEN_SECRET',
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }

  return {
    consumerKey: consumerKey!,
    consumerSecret: consumerSecret!,
    accessToken: accessToken!,
    accessTokenSecret: accessTokenSecret!,
  };
}

export function createXClient(creds: XCreds) {
  return new TwitterApi({
    appKey: creds.consumerKey,
    appSecret: creds.consumerSecret,
    accessToken: creds.accessToken,
    accessSecret: creds.accessTokenSecret,
  });
}
