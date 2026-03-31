export type ViewportPresetId = "desktop" | "tablet" | "mobile";

export type ViewportPreset = {
  id: ViewportPresetId;
  label: string;
  width: number;
  description: string;
};

export const VIEWPORT_PRESETS: readonly ViewportPreset[] = [
  {
    id: "desktop",
    label: "Desktop",
    width: 1280,
    description: "Wide canvas for dashboard authoring.",
  },
  {
    id: "tablet",
    label: "Tablet",
    width: 768,
    description: "Medium viewport for responsive checks.",
  },
  {
    id: "mobile",
    label: "Mobile",
    width: 390,
    description: "Compact phone viewport simulation.",
  },
] as const;

export function getViewportPreset(id: ViewportPresetId): ViewportPreset {
  return (
    VIEWPORT_PRESETS.find((p) => p.id === id) ?? VIEWPORT_PRESETS[0]
  );
}
