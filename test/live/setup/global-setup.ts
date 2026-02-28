import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export default async function globalSetup() {
  // Verify gcloud CLI is available
  try {
    execSync('gcloud --version', { stdio: 'ignore' });
  } catch {
    throw new Error('gcloud CLI is not installed or not in PATH');
  }

  // Fetch JWT secret from Secret Manager
  const secret = execSync(
    'gcloud secrets versions access latest --secret=remember-e1-platform-service-token --project=com-f5-parm',
    { encoding: 'utf-8' },
  ).trim();

  if (!secret) {
    throw new Error('Failed to fetch JWT secret from Secret Manager');
  }

  // Write secret to temp file
  const secretPath = join(tmpdir(), '.remember-live-test-secret');
  writeFileSync(secretPath, secret, { mode: 0o600 });

  // Health check to warm the instance
  const healthRes = await fetch(
    'https://remember-rest-service-e1-dit6gawkbq-uc.a.run.app/health',
  );
  if (!healthRes.ok) {
    throw new Error(`E1 health check failed: ${healthRes.status}`);
  }

  console.log('Live test setup complete — secret fetched, service healthy');
}
