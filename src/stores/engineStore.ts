/**
 * Global engine store mirrors the latest snapshot received from the Rust core.
 *
 * The store is intentionally narrow: components subscribe to the slices they
 * actually need to keep re-renders cheap.  Channel writes are sent over IPC
 * immediately; the optimistic update for fader UI is a future improvement.
 */
import { create } from "zustand";
import { api, type EngineSnapshot, type OutputDescriptor } from "@/ipc/api";

interface EngineStore {
  ready: boolean;
  grandMaster: number;
  blackout: boolean;
  outputs: OutputDescriptor[];
  universes: { id: number; data: number[] }[];
  // Selected universe for the Live workspace.
  selectedUniverse: number;
  setSelectedUniverse: (id: number) => void;
  applySnapshot: (snap: EngineSnapshot) => void;
  bindEngineEvents: () => Promise<() => void>;
  setChannel: (universe: number, address: number, value: number) => void;
  setGrandMaster: (value: number) => void;
  toggleBlackout: () => void;
}

export const useEngine = create<EngineStore>((set, get) => ({
  ready: false,
  grandMaster: 255,
  blackout: false,
  outputs: [],
  universes: [],
  selectedUniverse: 0,

  setSelectedUniverse: (id) => set({ selectedUniverse: id }),

  applySnapshot: (snap) =>
    set({
      ready: true,
      grandMaster: snap.grandMaster,
      blackout: snap.blackout,
      outputs: snap.outputs,
      universes: snap.universes,
    }),

  async bindEngineEvents() {
    // Pull the first snapshot so the UI has something to render immediately.
    const snap = await api.getSnapshot();
    get().applySnapshot(snap);
    const unlisten = await api.onEngineTick(get().applySnapshot);
    return unlisten;
  },

  setChannel(universe, address, value) {
    // Optimistic update so faders feel instant.
    set((state) => {
      const universes = state.universes.map((u) => {
        if (u.id !== universe) return u;
        if (u.data[address - 1] === value) return u;
        const data = u.data.slice();
        data[address - 1] = value;
        return { ...u, data };
      });
      return { universes };
    });
    void api.setChannel(universe, address, value);
  },

  setGrandMaster(value) {
    set({ grandMaster: value });
    void api.setGrandMaster(value);
  },

  toggleBlackout() {
    const next = !get().blackout;
    set({ blackout: next });
    void api.blackout(next);
  },
}));
