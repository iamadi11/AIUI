import type { Action } from "@aiui/dsl-schema";
import { evaluateExpression, isTruthy } from "@aiui/expression";
import { setPathImmutable } from "./path";

export type ActionEnvironment = {
  getState: () => Record<string, unknown>;
  setState: (next: Record<string, unknown>) => void;
  navigate: (href: string) => void;
  fetch: typeof fetch;
  notify?: (payload: {
    level: "info" | "success" | "warning" | "error";
    message: string;
  }) => void;
  modal?: (target: string, action: "open" | "close") => void;
};

async function runHttpLikeAction(
  action: Extract<Action, { type: "http" } | { type: "fetch" }>,
  env: ActionEnvironment,
): Promise<unknown> {
  const headers: Record<string, string> = { ...action.headers };
  let body: string | undefined;
  if (action.body !== undefined && action.body !== null) {
    if (typeof action.body === "string") {
      body = action.body;
    } else {
      body = JSON.stringify(action.body);
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
  }
  const res = await env.fetch(action.url, {
    method: action.method,
    headers,
    body,
  });
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  return await res.text();
}

export async function runAction(
  action: Action,
  env: ActionEnvironment,
): Promise<void> {
  switch (action.type) {
    case "setState": {
      const next = setPathImmutable(env.getState(), action.path, action.value);
      env.setState(next);
      return;
    }
    case "navigate":
      env.navigate(action.href);
      return;
    case "fetch": {
      const payload = await runHttpLikeAction(action, env);
      if (action.assignTo) {
        const next = setPathImmutable(env.getState(), action.assignTo, payload);
        env.setState(next);
      }
      return;
    }
    case "http": {
      await runHttpLikeAction(action, env);
      return;
    }
    case "transform": {
      const value = evaluateExpression(action.expression, env.getState());
      const next = setPathImmutable(env.getState(), action.path, value);
      env.setState(next);
      return;
    }
    case "modal": {
      env.modal?.(action.target, action.action);
      return;
    }
    case "notify": {
      env.notify?.({ level: action.level, message: action.message });
      return;
    }
    case "sequence": {
      for (const step of action.steps) {
        await runAction(step, env);
      }
      return;
    }
    case "condition": {
      const pass = isTruthy(
        evaluateExpression(action.when, env.getState()),
      );
      if (pass) {
        await runAction(action.then, env);
      } else if (action.else) {
        await runAction(action.else, env);
      }
      return;
    }
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export async function runActions(
  actions: Action[],
  env: ActionEnvironment,
): Promise<void> {
  for (const a of actions) {
    await runAction(a, env);
  }
}
