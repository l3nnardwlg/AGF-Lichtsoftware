import { create } from "zustand";
import { nanoid } from "../lib/nanoid";

/** ── Fixture library types ─────────────────────────────────── */

export type ChannelFunction =
  | "intensity"
  | "red"
  | "green"
  | "blue"
  | "white"
  | "amber"
  | "uv"
  | "cyan"
  | "magenta"
  | "yellow"
  | "color-temp"
  | "pan"
  | "pan-fine"
  | "tilt"
  | "tilt-fine"
  | "gobo"
  | "gobo-rotation"
  | "prism"
  | "focus"
  | "zoom"
  | "iris"
  | "strobe"
  | "shutter"
  | "speed"
  | "color-wheel"
  | "macro"
  | "reset"
  | "control"
  | "raw";

export interface ChannelDef {
  offset: number;          // 1-based offset within fixture footprint
  function: ChannelFunction;
  label?: string;
}

export interface FixtureProfile {
  id: string;              // "generic.rgbw-par"
  manufacturer: string;
  model: string;
  mode: string;            // "8-ch RGBW"
  footprint: number;       // total DMX channels
  channels: ChannelDef[];
}

/** ── Patch (placement of profile instances on universes) ──── */

export interface PatchedFixture {
  id: string;              // unique instance id
  profileId: string;
  name: string;            // e.g. "Spot 1"
  universe: number;        // 0-based universe index
  address: number;         // 1-based start address
  /** Stage position for the visualizer (normalised 0..1) */
  x: number;
  y: number;
}

interface PatchState {
  profiles: FixtureProfile[];
  fixtures: PatchedFixture[];
  selectedIds: string[];

  addFixture: (profileId: string, universe: number, address: number) => void;
  removeFixture: (id: string) => void;
  moveFixture: (id: string, x: number, y: number) => void;
  selectFixture: (id: string, additive?: boolean) => void;
  clearSelection: () => void;
  renameFixture: (id: string, name: string) => void;
}

/** Minimal built-in fixture library (extendable later from JSON files) */
const BUILT_IN: FixtureProfile[] = [
  {
    id: "generic.dimmer",
    manufacturer: "Generic",
    model: "1ch Dimmer",
    mode: "1ch",
    footprint: 1,
    channels: [{ offset: 1, function: "intensity", label: "Dim" }],
  },
  {
    id: "generic.rgb-par",
    manufacturer: "Generic",
    model: "RGB PAR",
    mode: "3ch",
    footprint: 3,
    channels: [
      { offset: 1, function: "red", label: "R" },
      { offset: 2, function: "green", label: "G" },
      { offset: 3, function: "blue", label: "B" },
    ],
  },
  {
    id: "generic.rgbw-par",
    manufacturer: "Generic",
    model: "RGBW PAR",
    mode: "4ch",
    footprint: 4,
    channels: [
      { offset: 1, function: "red", label: "R" },
      { offset: 2, function: "green", label: "G" },
      { offset: 3, function: "blue", label: "B" },
      { offset: 4, function: "white", label: "W" },
    ],
  },
  {
    id: "generic.rgbw-dim-par",
    manufacturer: "Generic",
    model: "RGBW + Dim PAR",
    mode: "5ch",
    footprint: 5,
    channels: [
      { offset: 1, function: "intensity", label: "Dim" },
      { offset: 2, function: "red", label: "R" },
      { offset: 3, function: "green", label: "G" },
      { offset: 4, function: "blue", label: "B" },
      { offset: 5, function: "white", label: "W" },
    ],
  },
  {
    id: "generic.moving-head-12",
    manufacturer: "Generic",
    model: "Moving Head",
    mode: "12ch RGBW",
    footprint: 12,
    channels: [
      { offset: 1, function: "pan", label: "Pan" },
      { offset: 2, function: "pan-fine", label: "Pan-F" },
      { offset: 3, function: "tilt", label: "Tilt" },
      { offset: 4, function: "tilt-fine", label: "Tilt-F" },
      { offset: 5, function: "speed", label: "Speed" },
      { offset: 6, function: "intensity", label: "Dim" },
      { offset: 7, function: "strobe", label: "Strobe" },
      { offset: 8, function: "red", label: "R" },
      { offset: 9, function: "green", label: "G" },
      { offset: 10, function: "blue", label: "B" },
      { offset: 11, function: "white", label: "W" },
      { offset: 12, function: "macro", label: "Macro" },
    ],
  },
  {
    id: "generic.moving-head-16",
    manufacturer: "Generic",
    model: "Spot Moving Head",
    mode: "16ch CMY+Gobo",
    footprint: 16,
    channels: [
      { offset: 1, function: "pan", label: "Pan" },
      { offset: 2, function: "pan-fine", label: "Pan-F" },
      { offset: 3, function: "tilt", label: "Tilt" },
      { offset: 4, function: "tilt-fine", label: "Tilt-F" },
      { offset: 5, function: "speed", label: "Speed" },
      { offset: 6, function: "intensity", label: "Dim" },
      { offset: 7, function: "strobe", label: "Strobe" },
      { offset: 8, function: "cyan", label: "C" },
      { offset: 9, function: "magenta", label: "M" },
      { offset: 10, function: "yellow", label: "Y" },
      { offset: 11, function: "color-wheel", label: "Color" },
      { offset: 12, function: "gobo", label: "Gobo" },
      { offset: 13, function: "gobo-rotation", label: "G-Rot" },
      { offset: 14, function: "prism", label: "Prism" },
      { offset: 15, function: "focus", label: "Focus" },
      { offset: 16, function: "zoom", label: "Zoom" },
    ],
  },
];

export const usePatchStore = create<PatchState>((set) => ({
  profiles: BUILT_IN,
  fixtures: [],
  selectedIds: [],

  addFixture: (profileId, universe, address) =>
    set((s) => {
      const profile = s.profiles.find((p) => p.id === profileId);
      if (!profile) return s;
      const count = s.fixtures.filter((f) => f.profileId === profileId).length + 1;
      const fx: PatchedFixture = {
        id: nanoid(),
        profileId,
        name: `${profile.model} ${count}`,
        universe,
        address,
        x: 0.1 + (s.fixtures.length % 8) * 0.1,
        y: 0.1 + Math.floor(s.fixtures.length / 8) * 0.12,
      };
      return { fixtures: [...s.fixtures, fx] };
    }),

  removeFixture: (id) =>
    set((s) => ({
      fixtures: s.fixtures.filter((f) => f.id !== id),
      selectedIds: s.selectedIds.filter((x) => x !== id),
    })),

  moveFixture: (id, x, y) =>
    set((s) => ({
      fixtures: s.fixtures.map((f) => (f.id === id ? { ...f, x, y } : f)),
    })),

  selectFixture: (id, additive) =>
    set((s) => {
      if (additive) {
        return s.selectedIds.includes(id)
          ? { selectedIds: s.selectedIds.filter((x) => x !== id) }
          : { selectedIds: [...s.selectedIds, id] };
      }
      return { selectedIds: [id] };
    }),

  clearSelection: () => set({ selectedIds: [] }),

  renameFixture: (id, name) =>
    set((s) => ({
      fixtures: s.fixtures.map((f) => (f.id === id ? { ...f, name } : f)),
    })),
}));
