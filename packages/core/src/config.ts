import type { DynaUIConfig } from "./types.js";

export function mergeConfig(
  globalCfg: DynaUIConfig | undefined,
  instanceCfg: DynaUIConfig | undefined,
): DynaUIConfig {
  const g = globalCfg ?? {};
  const i = instanceCfg ?? {};
  return {
    ...g,
    ...i,
    preferredComponents: {
      ...g.preferredComponents,
      ...i.preferredComponents,
    },
    excludeComponents: [
      ...(g.excludeComponents ?? []),
      ...(i.excludeComponents ?? []),
    ],
    fields: { ...g.fields, ...i.fields },
  };
}

export function fieldConfigForPath(
  cfg: DynaUIConfig,
  path: string[],
): Partial<DynaUIConfig> {
  const key = path.join(".");
  return cfg.fields?.[key] ?? {};
}
