
import 'dotenv/config';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import fs from 'node:fs/promises';
import path from 'node:path';

const tokenEnvPath = path.resolve(
  process.env.GOOGLE_TOKEN_FILE ?? path.join(process.cwd(), '.env.google-calendar'),
);

function asTokenString(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

if (!clientId || !clientSecret || !redirectUri) {
  throw new Error(
    'Google OAuth settings are missing from backend .env',
  );
}

export const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri,
);

export function getGoogleAuthorizationUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
  });
}

export async function saveGoogleTokens(
  tokens: Record<string, unknown>,
): Promise<void> {
  let oldEnvironment: Record<string, string> = {};

  try {
    oldEnvironment = dotenv.parse(await fs.readFile(tokenEnvPath, 'utf8'));
  } catch {
    // No saved token environment exists yet.
  }

  const savedEnvironment: Record<string, string | undefined> = {
    GOOGLE_CALENDAR_ACCESS_TOKEN:
      asTokenString(tokens.access_token) ?? oldEnvironment.GOOGLE_CALENDAR_ACCESS_TOKEN,
    GOOGLE_CALENDAR_REFRESH_TOKEN:
      asTokenString(tokens.refresh_token) ?? oldEnvironment.GOOGLE_CALENDAR_REFRESH_TOKEN,
    GOOGLE_CALENDAR_EXPIRY_DATE:
      asTokenString(tokens.expiry_date) ?? oldEnvironment.GOOGLE_CALENDAR_EXPIRY_DATE,
    GOOGLE_CALENDAR_SCOPE:
      asTokenString(tokens.scope) ?? oldEnvironment.GOOGLE_CALENDAR_SCOPE,
    GOOGLE_CALENDAR_TOKEN_TYPE:
      asTokenString(tokens.token_type) ?? oldEnvironment.GOOGLE_CALENDAR_TOKEN_TYPE,
  };

  const contents = Object.entries(savedEnvironment)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('\n');

  await fs.writeFile(tokenEnvPath, `${contents}\n`, { mode: 0o600 });

  oauth2Client.setCredentials({
    access_token: savedEnvironment.GOOGLE_CALENDAR_ACCESS_TOKEN,
    refresh_token: savedEnvironment.GOOGLE_CALENDAR_REFRESH_TOKEN,
    expiry_date: Number(savedEnvironment.GOOGLE_CALENDAR_EXPIRY_DATE) || undefined,
    scope: savedEnvironment.GOOGLE_CALENDAR_SCOPE,
    token_type: savedEnvironment.GOOGLE_CALENDAR_TOKEN_TYPE,
  });
}

export async function loadGoogleTokens(): Promise<boolean> {
  try {
    const savedEnvironment = dotenv.parse(await fs.readFile(tokenEnvPath, 'utf8'));
    const accessToken = savedEnvironment.GOOGLE_CALENDAR_ACCESS_TOKEN;
    const refreshToken = savedEnvironment.GOOGLE_CALENDAR_REFRESH_TOKEN;

    if (!accessToken && !refreshToken) {
      return false;
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: Number(savedEnvironment.GOOGLE_CALENDAR_EXPIRY_DATE) || undefined,
      scope: savedEnvironment.GOOGLE_CALENDAR_SCOPE,
      token_type: savedEnvironment.GOOGLE_CALENDAR_TOKEN_TYPE,
    });
    return true;
  } catch {
    return false;
  }
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  return loadGoogleTokens();
}
