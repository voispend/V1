/**
 * Safe fetch wrapper with timeouts and error redaction
 * Prevents PII from appearing in logs
 */

type FetchOpts = RequestInit & { timeoutMs?: number };

export async function safeFetch(url: string, opts: FetchOpts = {}) {
  const { timeoutMs = 15000, ...rest } = opts;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, { ...rest, signal: controller.signal });
    return res;
  } catch (e: any) {
    // Do not log full request bodies or PII
    // Only log safe information like error type and URL
    if (__DEV__) {
      console.error('Network error', { 
        url, 
        code: e?.name || 'unknown',
        message: e?.message || 'unknown error'
      });
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}

// Export with default timeout
export const fetchWithTimeout = (url: string, opts: RequestInit = {}) => 
  safeFetch(url, { ...opts, timeoutMs: 15000 });
