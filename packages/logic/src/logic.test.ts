import { describe, expect, it, vi } from "vitest";
import type { Action } from "@aiui/dsl-schema";
import { runAction, runActions } from "./run";
import { setPathImmutable } from "./path";

describe("setPathImmutable", () => {
  it("sets nested keys", () => {
    const next = setPathImmutable({ a: { b: 1 } }, "a.c", 2);
    expect(next).toEqual({ a: { b: 1, c: 2 } });
  });

  it("rejects unsafe segments", () => {
    expect(() => setPathImmutable({}, "__proto__.x", 1)).toThrow();
  });
});

function createEnv(initial: Record<string, unknown>) {
  let state = initial;
  const navigate = vi.fn();
  const notify = vi.fn();
  const modal = vi.fn();
  const fetch = vi.fn().mockResolvedValue(new Response());
  const env = {
    getState: () => state,
    setState: (next: Record<string, unknown>) => {
      state = next;
    },
    navigate,
    notify,
    modal,
    fetch: fetch as typeof globalThis.fetch,
  };
  return { env, navigate, fetch, notify, modal };
}

describe("runAction", () => {
  it("runs setState", async () => {
    const { env } = createEnv({});
    const action: Action = { type: "setState", path: "count", value: 3 };
    await runAction(action, env);
    expect(env.getState()).toEqual({ count: 3 });
  });

  it("runs navigate", async () => {
    const { env, navigate } = createEnv({});
    await runAction({ type: "navigate", href: "/x" }, env);
    expect(navigate).toHaveBeenCalledWith("/x");
  });

  it("runs http with JSON body", async () => {
    const { env, fetch } = createEnv({});
    await runAction(
      {
        type: "http",
        method: "POST",
        url: "https://example.com/api",
        body: { a: 1 },
      },
      env,
    );
    expect(fetch).toHaveBeenCalledWith("https://example.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"a":1}',
    });
  });

  it("runs condition", async () => {
    const { env, navigate } = createEnv({ ok: true });
    const action: Action = {
      type: "condition",
      when: "ok",
      then: { type: "navigate", href: "/yes" },
      else: { type: "navigate", href: "/no" },
    };
    await runAction(action, env);
    expect(navigate).toHaveBeenCalledWith("/yes");
  });

  it("runs sequence", async () => {
    const { env } = createEnv({});
    await runActions(
      [
        { type: "setState", path: "a", value: 1 },
        { type: "setState", path: "b", value: 2 },
      ],
      env,
    );
    expect(env.getState()).toEqual({ a: 1, b: 2 });
  });

  it("runs fetch and assigns JSON payload", async () => {
    const { env, fetch } = createEnv({});
    fetch.mockResolvedValue(
      new Response('{"rows":[1,2]}', {
        headers: { "content-type": "application/json" },
      }),
    );
    await runAction(
      {
        type: "fetch",
        method: "GET",
        url: "https://example.com/data",
        assignTo: "table.rows",
      },
      env,
    );
    expect(fetch).toHaveBeenCalledWith("https://example.com/data", {
      method: "GET",
      headers: {},
      body: undefined,
    });
    expect(env.getState()).toEqual({ table: { rows: { rows: [1, 2] } } });
  });

  it("runs transform expression", async () => {
    const { env } = createEnv({ count: 2 });
    await runAction(
      { type: "transform", path: "double", expression: "count * 2" },
      env,
    );
    expect(env.getState()).toEqual({ count: 2, double: 4 });
  });

  it("runs notify and modal hooks", async () => {
    const { env, notify, modal } = createEnv({});
    await runAction(
      { type: "notify", level: "success", message: "Saved" },
      env,
    );
    await runAction({ type: "modal", action: "open", target: "edit-user" }, env);
    expect(notify).toHaveBeenCalledWith({ level: "success", message: "Saved" });
    expect(modal).toHaveBeenCalledWith("edit-user", "open");
  });
});
