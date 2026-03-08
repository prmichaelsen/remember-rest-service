const BASE_URL = 'https://remember-rest-service-e1-dit6gawkbq-uc.a.run.app';

export interface LiveResponse<T = any> {
  status: number;
  body: T;
}

async function liveRequest<T = any>(
  method: string,
  path: string,
  options?: {
    body?: unknown;
    token?: string;
  },
): Promise<LiveResponse<T>> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  let body: T;
  try {
    body = (await res.json()) as T;
  } catch {
    body = undefined as T;
  }

  return { status: res.status, body };
}

export const get = <T = any>(path: string, token?: string) =>
  liveRequest<T>('GET', path, { token });

export const post = <T = any>(path: string, body: unknown, token?: string) =>
  liveRequest<T>('POST', path, { body, token });

export const patch = <T = any>(path: string, body: unknown, token?: string) =>
  liveRequest<T>('PATCH', path, { body, token });

export const put = <T = any>(path: string, body: unknown, token?: string) =>
  liveRequest<T>('PUT', path, { body, token });

export const del = <T = any>(path: string, body?: unknown, token?: string) =>
  liveRequest<T>('DELETE', path, { body, token });
