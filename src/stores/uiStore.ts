import { create } from "zustand";

export type AppMode = "setup" | "design" | "live";

interface UiState {
  mode: AppMode;
  outputsDrawerOpen: boolean;
  setMode: (m: AppMode) => void;
  toggleOutputs: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mode: "design",
  outputsDrawerOpen: false,
  setMode: (m) => set({ mode: m }),
  toggleOutputs: () => set((s) => ({ outputsDrawerOpen: !s.outputsDrawerOpen })),
}));
