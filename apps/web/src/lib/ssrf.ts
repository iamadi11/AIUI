const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
]);

function isPrivateIpv4(host: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  const parts = host.split(".").map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n) || n > 255)) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export interface SafeUrlResult {
  ok: true;
  url: URL;
}

export interface SafeUrlError {
  ok: false;
  error: string;
}

export type SafeUrlCheck = SafeUrlResult | SafeUrlError;

/**
 * Basic SSRF guard for demo/playground fetches. Prefer an allowlist in production.
 */
export function assertSafeHttpUrl(
  raw: string,
  options: { httpsOnly?: boolean } = {},
): SafeUrlCheck {
  const httpsOnly = options.httpsOnly ?? true;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
  if (httpsOnly && parsed.protocol !== "https:") {
    return { ok: false, error: "Only https URLs are allowed" };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "Unsupported protocol" };
  }
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) {
    return { ok: false, error: "Host is blocked" };
  }
  if (host.endsWith(".local") || host.endsWith(".localhost")) {
    return { ok: false, error: "Host is blocked" };
  }
  if (isPrivateIpv4(host)) {
    return { ok: false, error: "Private IPv4 ranges are blocked" };
  }
  if (host.includes(":") && !host.includes(".")) {
    // crude IPv6 check — block link-local / unique local
    const h = host.replace(/^\[|\]$/g, "");
    if (h.toLowerCase().startsWith("fe80:")) {
      return { ok: false, error: "IPv6 link-local is blocked" };
    }
    if (h.toLowerCase().startsWith("fc") || h.toLowerCase().startsWith("fd")) {
      return { ok: false, error: "IPv6 unique local is blocked" };
    }
  }
  return { ok: true, url: parsed };
}
