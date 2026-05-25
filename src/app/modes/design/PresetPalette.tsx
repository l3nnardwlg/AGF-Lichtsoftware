import { useState } from "react";

interface Preset {
  id: string;
  label: string;
  color: string;
  type: "color" | "position" | "effect" | "scene";
}

const DEFAULT_PRESETS: Preset[] = [
  { id: "p1", label: "Warm",      color: "#ff8a3a", type: "color" },
  { id: "p2", label: "Cool",      color: "#64d2ff", type: "color" },
  { id: "p3", label: "Magenta",   color: "#bf5af2", type: "color" },
  { id: "p4", label: "Red",       color: "#ff453a", type: "color" },
  { id: "p5", label: "Center",    color: "#8e8e93", type: "position" },
  { id: "p6", label: "Audience",  color: "#8e8e93", type: "position" },
  { id: "p7", label: "Front",     color: "#8e8e93", type: "position" },
  { id: "p8", label: "Chase",     color: "#30d158", type: "effect" },
  { id: "p9", label: "Sine",      color: "#30d158", type: "effect" },
  { id: "p10", label: "Strobe",   color: "#ffd60a", type: "effect" },
  { id: "p11", label: "Verse",    color: "#5e5ce6", type: "scene" },
  { id: "p12", label: "Chorus",   color: "#5e5ce6", type: "scene" },
];

export function PresetPalette() {
  const [tab, setTab] = useState<Preset["type"] | "all">("all");
  const list = tab === "all" ? DEFAULT_PRESETS : DEFAULT_PRESETS.filter((p) => p.type === tab);

  return (
    <aside className="w-72 flex-shrink-0 panel-flat overflow-hidden flex flex-col">
      <div className="panel-header justify-between">
        <span>Presets</span>
        <button className="btn-ghost btn-sm">+ New</button>
      </div>
      <div className="px-2 pt-2 pb-1">
        <div className="segmented w-full justify-between">
          <button data-active={tab === "all"} onClick={() => setTab("all")}>All</button>
          <button data-active={tab === "color"} onClick={() => setTab("color")}>Color</button>
          <button data-active={tab === "position"} onClick={() => setTab("position")}>Pos</button>
          <button data-active={tab === "effect"} onClick={() => setTab("effect")}>FX</button>
          <button data-active={tab === "scene"} onClick={() => setTab("scene")}>Scene</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-3 gap-2">
          {list.map((p) => (
            <button
              key={p.id}
              className="aspect-square rounded-md border border-border bg-panel-2 hover:border-border-strong
                         hover:bg-panel-3 active:scale-[0.97] transition-all
                         flex flex-col items-center justify-end p-2 gap-1.5 relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${p.color}, transparent 70%)`,
                }}
              />
              <div
                className="w-10 h-10 rounded-md shadow-panel-sm relative z-10"
                style={{ background: p.color }}
              />
              <div className="text-[11px] text-text relative z-10 truncate w-full text-center">
                {p.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
