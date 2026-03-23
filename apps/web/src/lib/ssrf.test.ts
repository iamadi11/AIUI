import { describe, expect, it } from "vitest";
import { assertSafeHttpUrl } from "./ssrf";

describe("assertSafeHttpUrl", () => {
  it("allows public https URLs", () => {
    const r = assertSafeHttpUrl("https://jsonplaceholder.typicode.com/todos/1");
    expect(r.ok).toBe(true);
  });

  it("blocks localhost", () => {
    const r = assertSafeHttpUrl("http://localhost:8080/api");
    expect(r.ok).toBe(false);
  });

  it("blocks private IPv4", () => {
    expect(assertSafeHttpUrl("https://192.168.1.1/x").ok).toBe(false);
    expect(assertSafeHttpUrl("https://10.0.0.1/x").ok).toBe(false);
  });

  it("blocks non-https when httpsOnly", () => {
    expect(assertSafeHttpUrl("http://example.com", { httpsOnly: true }).ok).toBe(
      false,
    );
  });
});
