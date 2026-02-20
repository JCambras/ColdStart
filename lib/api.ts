import { API_URL } from './constants';

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

export async function apiGet<T>(
  endpoint: string,
  opts?: { seedPath?: string; transform?: (raw: unknown) => T }
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json = await res.json();
    return { data: (json.data ?? json) as T, error: null };
  } catch {
    // Fallback to seed data if provided
    if (opts?.seedPath) {
      try {
        const seedRes = await fetch(opts.seedPath);
        if (!seedRes.ok) throw new Error('Seed fetch failed');
        const raw = await seedRes.json();
        const data = opts.transform ? opts.transform(raw) : (raw as T);
        return { data, error: null };
      } catch {
        // Both failed
      }
    }
    return { data: null, error: 'Failed to load data' };
  }
}

/** Fetch a JSON file from /data/ (seed data). Typed wrapper for consistent error handling. */
export async function seedGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function apiPost<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : json.error?.message || 'Request failed');
    return { data: (json.data ?? json) as T, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Request failed' };
  }
}
