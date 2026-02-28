import { unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export default async function globalTeardown() {
  const secretPath = join(tmpdir(), '.remember-live-test-secret');
  if (existsSync(secretPath)) {
    unlinkSync(secretPath);
  }
}
