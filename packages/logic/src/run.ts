import type { Action } from "@aiui/dsl-schema";
import { evaluateExpression, isTruthy } from "@aiui/expression";
import { setPathImmutable } from "./path";

export type ActionEnvironment = {
  getState: () => Record<string, unknown>;
  setState: (next: Record<string, unknown>) => void;
  navigate: (href: string) => void;
  fetch: typeof fetch;
};

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
    case "http": {
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
      await env.fetch(action.url, {
        method: action.method,
        headers,
        body,
      });
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
