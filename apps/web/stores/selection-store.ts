import { create } from "zustand";

type SelectionState = {
  /** Primary selected node id (for inspector, breadcrumbs, etc.). */
  selectedNodeId: string | null;
  /** All selected node ids (including primary). */
  selectedIds: string[];
  /** Replace selection with a single id (or clear when null). */
  selectNode: (id: string | null) => void;
  /** Toggle a node in the current selection (multi-select). */
  toggleNode: (id: string) => void;
  /** Replace selection with many ids; last id becomes primary. */
  setSelection: (ids: string[]) => void;
  /** Clear all selection. */
  clearSelection: () => void;
  /** Reconcile selection against an external existence predicate. */
  reconcileSelection: (exists: (id: string) => boolean) => void;
};

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedNodeId: null,
  selectedIds: [],

  selectNode: (id) => {
    if (id === null) {
      set({ selectedNodeId: null, selectedIds: [] });
      return;
    }
    set({ selectedNodeId: id, selectedIds: [id] });
  },

  toggleNode: (id) => {
    const { selectedIds, selectedNodeId } = get();
    const exists = selectedIds.includes(id);
    if (exists) {
      const nextIds = selectedIds.filter((x) => x !== id);
      const nextPrimary =
        selectedNodeId === id ? (nextIds.length > 0 ? nextIds[0] : null) : selectedNodeId;
      set({ selectedIds: nextIds, selectedNodeId: nextPrimary });
    } else {
      const nextIds = [...selectedIds, id];
      set({ selectedIds: nextIds, selectedNodeId: id });
    }
  },

  setSelection: (ids) => {
    const normalized = Array.from(new Set(ids.filter(Boolean)));
    if (normalized.length === 0) {
      set({ selectedIds: [], selectedNodeId: null });
      return;
    }
    set({
      selectedIds: normalized,
      selectedNodeId: normalized[normalized.length - 1] ?? null,
    });
  },

  clearSelection: () => {
    set({ selectedNodeId: null, selectedIds: [] });
  },

  reconcileSelection: (exists) => {
    const { selectedNodeId, selectedIds } = get();
    const filtered = selectedIds.filter((id) => exists(id));
    const nextPrimary =
      selectedNodeId && exists(selectedNodeId)
        ? selectedNodeId
        : (filtered[0] ?? null);
    if (
      nextPrimary === selectedNodeId &&
      filtered.length === selectedIds.length &&
      filtered.every((id, idx) => id === selectedIds[idx])
    ) {
      return;
    }
    set({ selectedNodeId: nextPrimary, selectedIds: filtered });
  },
}));
