import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { rateLimit } from '../rateLimit';
import { NextRequest } from 'next/server';

function makeRequest(ip: string, pathname = '/api/test'): NextRequest {
  const url = `http://localhost${pathname}`;
  return new NextRequest(url, {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request', () => {
    const result = rateLimit(makeRequest('1.1.1.1'), 5, 60_000);
    expect(result).toBeNull();
  });

  it('allows N requests within window', () => {
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(makeRequest('2.2.2.2'), 5, 60_000);
      expect(result).toBeNull();
    }
  });

  it('returns 429 on N+1 request', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit(makeRequest('3.3.3.3'), 5, 60_000);
    }
    const result = rateLimit(makeRequest('3.3.3.3'), 5, 60_000);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });

  it('tracks different IPs independently', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit(makeRequest('4.4.4.4'), 5, 60_000);
    }
    // IP 4.4.4.4 is exhausted
    const blocked = rateLimit(makeRequest('4.4.4.4'), 5, 60_000);
    expect(blocked).not.toBeNull();

    // IP 5.5.5.5 should still be allowed
    const allowed = rateLimit(makeRequest('5.5.5.5'), 5, 60_000);
    expect(allowed).toBeNull();
  });

  it('resets counter after window expires', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit(makeRequest('6.6.6.6'), 5, 60_000);
    }
    const blocked = rateLimit(makeRequest('6.6.6.6'), 5, 60_000);
    expect(blocked).not.toBeNull();

    // Advance past the window
    vi.advanceTimersByTime(61_000);

    const allowed = rateLimit(makeRequest('6.6.6.6'), 5, 60_000);
    expect(allowed).toBeNull();
  });
});
