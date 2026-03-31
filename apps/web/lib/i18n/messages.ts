const EN_MESSAGES = {
  "builder.componentPaletteAriaLabel": "Component palette",
  "builder.workspaceHeading": "Builder workspace",
  "builder.actionsAriaLabel": "Builder actions",
  "builder.undo": "Undo",
  "builder.undoTitle": "Undo (⌘Z / Ctrl+Z)",
  "builder.redo": "Redo",
  "builder.redoTitle": "Redo (⌘⇧Z / Ctrl+Y)",
  "builder.preview": "Preview",
  "builder.addBoxToRoot": "Add Box to root",
  "builder.addStackToRoot": "Add Stack to root",
  "builder.resetDocument": "Reset document",
  "builder.duplicate": "Duplicate",
  "builder.duplicateTitle": "Duplicate layer (⌘D / Ctrl+D)",
  "builder.removeSelected": "Remove selected",
  "builder.largeDocumentGuardrailsActive": "Large document guardrails active",
  "builder.selectionLabel": "Selection:",
  "builder.selectionNone": "none",
  "builder.selectionMany": "{count} layers selected",
  "builder.emptyStateTitle": "Start with one small step",
  "builder.emptyStateBody":
    "Your page is empty. Add a Box, add a Stack, or drop in a starter dashboard from above to begin.",
  "builder.nearEmptyState":
    "Nice start. Add one more section to make your layout easier to work with.",
  "builder.tree": "Tree",
  "builder.liveDocument": "Live document (Zustand)",
  "builder.liveDocumentHidden":
    "Hidden by default for very large documents. Use export panel for targeted JSON inspection to avoid expensive rerenders.",
  "builder.propertiesInspectorAriaLabel": "Properties inspector",
  "builder.selectionHelp":
    "Click canvas or tree; double-click a label to rename. Esc clears selection. Root cannot be removed. Delete/Backspace removes the selection; ⌘/Ctrl+D duplicates. Undo/redo: ⌘Z / ⌘⇧Z (Ctrl+Z / Ctrl+Shift+Z or Ctrl+Y). Alt+↑ selects parent. See the Keyboard shortcuts panel below.",
  "walkthrough.quickStart": "Quick start",
  "walkthrough.buildFirstScreen": "Build your first screen in a few small steps.",
  "walkthrough.stepFirstLayer": "Add your first block",
  "walkthrough.stepFirstLayerHint": "Start simple: add one Box from Quick actions.",
  "walkthrough.stepStructure": "Build a simple layout",
  "walkthrough.stepStructureHint": "Try a starter layout to get a complete screen quickly.",
  "walkthrough.stepSelect": "Click a block to edit it",
  "walkthrough.stepSelectHint":
    "After selecting, use the right panel to change text and spacing.",
  "walkthrough.stepName": "Give one block a clear name",
  "walkthrough.stepNameHint": "Double-click a label in canvas or tree to rename it.",
  "walkthrough.momentum":
    "Nice momentum. Open Preview to check your layout as a user would see it.",
  "walkthrough.canvasEmpty":
    "Your canvas is empty. Add one block or start from a ready-made layout.",
  "walkthrough.canvasNearEmpty":
    "Great start. Add one more section to shape your page structure.",
  "walkthrough.quickActions": "Quick actions",
  "walkthrough.addBox": "Add Box",
  "walkthrough.addStack": "Add Stack",
  "walkthrough.useStarterDashboard": "Use Starter dashboard",
  "palette.components": "Components",
  "palette.searchPlaceholder": "Search…",
  "palette.searchAriaLabel": "Search components",
  "palette.noSearchMatch":
    "No components match your search. Try another word or clear the filter.",
  "palette.noComponentsRegistered": "No components registered.",
  "palette.emptyCategory":
    "Nothing here yet - primitives in this group will appear when added to the registry.",
  "palette.componentsAvailable": "{count} components available",
  "palette.componentAvailable": "1 component available",
  "palette.noComponentsAvailable": "No components available",
  "inspector.properties": "Properties",
  "inspector.selectNode": "Select a node in the tree or canvas to edit properties.",
  "inspector.nodeMissing": "Selected node is no longer in the document.",
  "inspector.root": "Root",
  "inspector.noEditableProps": "No editable properties for this component.",
  "inspector.contentHelper": "Primary labels and visible text.",
  "inspector.actionsHelper":
    "What happens when users interact with this component.",
  "inspector.layoutHelper": "Spacing and sizing rules that shape this component.",
  "inspector.dataHelper": "Data source and binding controls appear here.",
  "inspector.visibilityHelper":
    "Show/hide and enable/disable rules appear here.",
  "inspector.noActionTriggers":
    "This component does not currently expose action triggers.",
  "inspector.visibleWhen": "Visible when (expression)",
  "inspector.visibleWhenPlaceholder": 'status === "active"',
  "inspector.interactiveWhen": "Interactive when (expression)",
  "inspector.interactiveWhenPlaceholder": "permissions.canEdit",
  "inspector.visibilityRulesHelp":
    "Rules are saved with this node as expressions and can be interpreted by runtime parity tooling in later phases.",
  "tree.root": "Root",
  "shortcuts.title": "Keyboard shortcuts",
  "shortcuts.undoRedo": "Undo / redo",
  "shortcuts.clearSelection": "Clear selection",
  "shortcuts.toggleMultiSelect": "Toggle multi-select",
  "shortcuts.selectAllLayers": "Select all layers",
  "shortcuts.rangeSelectInTree": "Range select in tree",
  "shortcuts.selectParentLayer": "Select parent layer",
  "shortcuts.deleteSelectedLayer": "Delete selected layer",
  "shortcuts.duplicateSelectedLayer": "Duplicate selected layer",
  "shortcuts.ignoredWhileTyping":
    "Shortcuts are ignored while typing in inputs and text areas.",
  "preview.runtimePreviewAriaLabel": "Runtime preview",
  "preview.openBuilderControls": "Open builder controls",
  "preview.title": "Preview (Developer mode)",
  "preview.runtimeUses":
    "Runtime preview uses @aiui/runtime-core; the React panel below is a dev host via @aiui/registry. Same in-memory document as the builder.",
  "preview.hideChrome": "Hide preview chrome",
  "preview.validSchema": "Valid against schema",
  "preview.invalidSchema": "Schema validation failed",
  "preview.parityDiagnostics": "Parity diagnostics",
  "preview.parityOk": "ok",
  "preview.parityFail": "{count} invalid rect(s), deterministic={deterministic}",
  "preview.parityAction":
    "Action: inspect node layout constraints for the failing viewport presets and rerun preview diagnostics after updates.",
  "preview.runtimeDom": "Runtime preview (DOM)",
  "preview.selectViewportAriaLabel": "Select simulated viewport",
  "preview.viewportAriaLabel": "{label} viewport",
  "runtime.simulatedViewport": "Simulated viewport:",
} as const;

type MessageKey = keyof typeof EN_MESSAGES;
type MessageVars = Record<string, string | number | boolean>;

export function msg(key: MessageKey, vars?: MessageVars): string {
  const template = EN_MESSAGES[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = vars[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}
