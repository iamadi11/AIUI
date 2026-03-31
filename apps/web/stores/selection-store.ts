import { create } from "zustand";

type SelectionState = {
  selectedNodeId: string | null;
  selectNode: (id: string | null) => void;
};

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedNodeId: null,
  selectNode: (id) => set({ selectedNodeId: id }),
}));
