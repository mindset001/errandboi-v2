export interface ApiResult<T = Record<string, any>> { // eslint-disable-line @typescript-eslint/no-explicit-any
  ok: boolean;
  status: number; // 0 = network failure or timeout
  data: T;
}

/**
 * fetch that never throws: network failures, timeouts and non-JSON bodies all
 * come back as a normal result with a user-presentable `data.error`.
 */
export async function apiFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs = 20_000
): Promise<ApiResult> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: "Network problem. Check your connection and try again." },
    };
  }
}

export function postJson(url: string, body: unknown, timeoutMs?: number) {
  return apiFetch(
    url,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    timeoutMs
  );
}
