import { useMemo, useState } from "react";
import { usePatchStore, type FixtureProfile } from "../../../stores/patchStore";

interface Props {
  onDragStart: (profileId: string) => void;
}

/** Left sidebar listing fixture profiles. Drag onto Universe Grid. */
export function FixtureLibrary({ onDragStart }: Props) {
  const profiles = usePatchStore((s) => s.profiles);
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? profiles.filter(
          (p) =>
            p.manufacturer.toLowerCase().includes(q) ||
            p.model.toLowerCase().includes(q) ||
            p.mode.toLowerCase().includes(q),
        )
      : profiles;
    const map = new Map<string, FixtureProfile[]>();
    for (const p of filtered) {
      const arr = map.get(p.manufacturer) ?? [];
      arr.push(p);
      map.set(p.manufacturer, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [profiles, search]);

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col panel-flat overflow-hidden">
      <div className="panel-header justify-between">
        <span>Fixture Library</span>
        <span className="text-text-dim/40">{profiles.length}</span>
      </div>
      <div className="p-2 border-b border-border">
        <input
          className="input w-full"
          placeholder="Search fixtures…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {grouped.map(([mfr, items]) => (
          <div key={mfr} className="mb-2">
            <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-2">
              {mfr}
            </div>
            {items.map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-fixture-profile", p.id);
                  e.dataTransfer.effectAllowed = "copy";
                  onDragStart(p.id);
                }}
                className="group flex items-center gap-2 px-2 h-9 rounded mx-1
                           hover:bg-panel-2 cursor-grab active:cursor-grabbing
                           transition-colors"
              >
                <div className="w-5 h-5 rounded-xs bg-panel-3 flex items-center justify-center text-[10px] text-muted">
                  {p.footprint}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-text truncate">{p.model}</div>
                  <div className="text-[10px] text-muted truncate">{p.mode}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
