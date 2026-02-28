import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as jsonwebtoken from 'jsonwebtoken';

const jwt = (jsonwebtoken as any).default ?? jsonwebtoken;

let cachedSecret: string | null = null;

function getSecret(): string {
  if (!cachedSecret) {
    const secretPath = join(tmpdir(), '.remember-live-test-secret');
    cachedSecret = readFileSync(secretPath, 'utf-8').trim();
  }
  return cachedSecret;
}

export function makeToken(sub: string, overrides?: jsonwebtoken.SignOptions): string {
  return jwt.sign({ sub }, getSecret(), {
    issuer: 'agentbase.me',
    audience: 'svc',
    expiresIn: '1h',
    ...overrides,
  });
}

export function makeExpiredToken(sub: string): string {
  return makeToken(sub, { expiresIn: '-1s' });
}

export function makeWrongAudienceToken(sub: string): string {
  return jwt.sign({ sub }, getSecret(), {
    issuer: 'agentbase.me',
    audience: 'wrong',
    expiresIn: '1h',
  });
}
