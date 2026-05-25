import { create } from "zustand";
import { nanoid } from "../lib/nanoid";

export interface Cue {
  id: string;
  label: string;
  color: string;          // accent color hex
  /** Channel snapshots to apply when fired: [universe, address, value] */
  values: Array<[number, number, number]>;
  /** Active row in the 8×4 grid */
  row: number;
  col: number;
}

interface CueState {
  cues: Cue[];
  activeId: string | null;
  bpm: number;
  tapTimestamps: number[];

  addCue: (row: number, col: number, label?: string) => void;
  removeCue: (id: string) => void;
  fireCue: (id: string) => void;
  releaseAll: () => void;
  tap: () => void;
  resetBpm: () => void;
}

const DEFAULT_COLORS = [
  "#007aff", "#5e5ce6", "#bf5af2", "#ff375f",
  "#ff9f0a", "#ffd60a", "#30d158", "#64d2ff",
];

export const useCueStore = create<CueState>((set) => ({
  cues: [],
  activeId: null,
  bpm: 120,
  tapTimestamps: [],

  addCue: (row, col, label) =>
    set((s) => ({
      cues: [
        ...s.cues,
        {
          id: nanoid(),
          label: label ?? `Cue ${s.cues.length + 1}`,
          color: DEFAULT_COLORS[(row * 8 + col) % DEFAULT_COLORS.length],
          values: [],
          row,
          col,
        },
      ],
    })),

  removeCue: (id) =>
    set((s) => ({
      cues: s.cues.filter((c) => c.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    })),

  fireCue: (id) => set({ activeId: id }),
  releaseAll: () => set({ activeId: null }),

  tap: () =>
    set((s) => {
      const now = performance.now();
      // keep last 6 taps within 3 seconds
      const recent = s.tapTimestamps.filter((t) => now - t < 3000).slice(-5);
      const next = [...recent, now];
      if (next.length < 2) return { tapTimestamps: next };
      const intervals = next.slice(1).map((t, i) => t - next[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round((60_000 / avg) * 10) / 10;
      return {
        tapTimestamps: next,
        bpm: Math.max(20, Math.min(240, bpm)),
      };
    }),

  resetBpm: () => set({ bpm: 120, tapTimestamps: [] }),
}));
