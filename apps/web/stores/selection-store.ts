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
  /** Clear all selection. */
  clearSelection: () => void;
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

  clearSelection: () => {
    set({ selectedNodeId: null, selectedIds: [] });
  },
}));
