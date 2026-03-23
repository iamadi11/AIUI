import { NextResponse } from "next/server";
import { assertSafeHttpUrl } from "@/lib/ssrf";

export const runtime = "nodejs";

const MAX_BYTES = 512_000;
const TIMEOUT_MS = 12_000;

export async function POST(req: Request) {
  let body: { url?: string; headers?: Record<string, string> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const urlStr = body.url?.trim();
  if (!urlStr) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const safe = assertSafeHttpUrl(urlStr, { httpsOnly: true });
  if (!safe.ok) {
    return NextResponse.json({ error: safe.error }, { status: 400 });
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(safe.url.toString(), {
      method: "GET",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(body.headers ?? {}),
      },
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json") && !ct.includes("text/json")) {
      return NextResponse.json(
        { error: "Response is not JSON (content-type check)" },
        { status: 415 },
      );
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Response too large" }, { status: 413 });
    }
    const text = new TextDecoder().decode(buf);
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return NextResponse.json({ error: "Body is not valid JSON" }, { status: 422 });
    }
    return NextResponse.json({ ok: true, status: res.status, data: json });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
