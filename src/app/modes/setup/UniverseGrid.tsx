import { useMemo, useState } from "react";
import { usePatchStore } from "../../../stores/patchStore";

const UNIVERSES_VISIBLE = 4;
const CHANNELS_PER_UNIVERSE = 512;
const COLUMNS = 32;

/** Color palette per profile id (stable hash for variety) */
function profileColor(id: string): string {
  const palette = [
    "#007aff", "#5e5ce6", "#bf5af2", "#ff375f",
    "#ff9f0a", "#ffd60a", "#30d158", "#64d2ff",
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

export function UniverseGrid() {
  const fixtures = usePatchStore((s) => s.fixtures);
  const profiles = usePatchStore((s) => s.profiles);
  const addFixture = usePatchStore((s) => s.addFixture);
  const removeFixture = usePatchStore((s) => s.removeFixture);
  const selectFixture = usePatchStore((s) => s.selectFixture);
  const selectedIds = usePatchStore((s) => s.selectedIds);

  const [dragOver, setDragOver] = useState<{
    universe: number;
    address: number;
    valid: boolean;
  } | null>(null);

  /** map universe → [address] → fixture instance */
  const occupancy = useMemo(() => {
    const map = new Map<number, Map<number, string>>();
    for (const f of fixtures) {
      const profile = profiles.find((p) => p.id === f.profileId);
      if (!profile) continue;
      const uMap = map.get(f.universe) ?? new Map();
      for (let i = 0; i < profile.footprint; i++) {
        uMap.set(f.address + i, f.id);
      }
      map.set(f.universe, uMap);
    }
    return map;
  }, [fixtures, profiles]);

  const isAvailable = (universe: number, address: number, footprint: number) => {
    if (address + footprint - 1 > CHANNELS_PER_UNIVERSE) return false;
    const u = occupancy.get(universe);
    if (!u) return true;
    for (let i = 0; i < footprint; i++) if (u.has(address + i)) return false;
    return true;
  };

  return (
    <div className="flex-1 panel-flat overflow-hidden flex flex-col">
      <div className="panel-header justify-between">
        <span>Universe Grid</span>
        <span className="text-text-dim/40">
          {fixtures.length} fixtures patched
        </span>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {Array.from({ length: UNIVERSES_VISIBLE }).map((_, universe) => (
          <UniverseRow
            key={universe}
            universe={universe}
            occupancy={occupancy.get(universe) ?? new Map()}
            fixtures={fixtures.filter((f) => f.universe === universe)}
            dragOver={dragOver?.universe === universe ? dragOver : null}
            selectedIds={selectedIds}
            onDragEnter={(addr, profileId) => {
              const profile = profiles.find((p) => p.id === profileId);
              if (!profile) return;
              setDragOver({
                universe,
                address: addr,
                valid: isAvailable(universe, addr, profile.footprint),
              });
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(addr, profileId) => {
              const profile = profiles.find((p) => p.id === profileId);
              if (!profile) return;
              if (!isAvailable(universe, addr, profile.footprint)) return;
              addFixture(profileId, universe, addr);
              setDragOver(null);
            }}
            onSelect={selectFixture}
            onRemove={removeFixture}
            profileColor={profileColor}
            getProfile={(id) => profiles.find((p) => p.id === id)}
          />
        ))}
      </div>
    </div>
  );
}

interface RowProps {
  universe: number;
  occupancy: Map<number, string>;
  fixtures: ReturnType<typeof usePatchStore.getState>["fixtures"];
  dragOver: { address: number; valid: boolean } | null;
  selectedIds: string[];
  onDragEnter: (addr: number, profileId: string) => void;
  onDragLeave: () => void;
  onDrop: (addr: number, profileId: string) => void;
  onSelect: (id: string, additive?: boolean) => void;
  onRemove: (id: string) => void;
  profileColor: (id: string) => string;
  getProfile: (id: string) => ReturnType<typeof usePatchStore.getState>["profiles"][number] | undefined;
}

function UniverseRow(p: RowProps) {
  const rows = Math.ceil(CHANNELS_PER_UNIVERSE / COLUMNS);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <h3 className="text-[12px] font-semibold text-text">
          Universe {p.universe + 1}
        </h3>
        <span className="text-[10px] text-muted-2 font-mono">
          {p.fixtures.length}/{CHANNELS_PER_UNIVERSE} ch
        </span>
      </div>

      <div className="grid gap-px bg-border rounded overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0,1fr))` }}>
        {Array.from({ length: rows * COLUMNS }).map((_, idx) => {
          const address = idx + 1;
          if (address > CHANNELS_PER_UNIVERSE) {
            return <div key={idx} className="bg-workspace" />;
          }
          const fxId = p.occupancy.get(address);
          const fx = fxId ? p.fixtures.find((f) => f.id === fxId) : undefined;
          const profile = fx ? p.getProfile(fx.profileId) : undefined;
          const isFirst = fx && profile && fx.address === address;
          const isSelected = fxId ? p.selectedIds.includes(fxId) : false;
          const inHover =
            p.dragOver &&
            address >= p.dragOver.address &&
            address < p.dragOver.address + 16; // approximate visual feedback

          const cellBg = fx
            ? p.profileColor(fx.profileId)
            : inHover
              ? p.dragOver?.valid
                ? "rgba(0,122,255,0.25)"
                : "rgba(255,69,58,0.2)"
              : undefined;

          return (
            <div
              key={idx}
              data-address={address}
              className={`relative h-6 text-[9px] font-mono flex items-center justify-center
                          transition-colors cursor-pointer select-none
                          ${fx ? "text-white/90" : "text-muted-2 bg-panel hover:bg-panel-2"}
                          ${isSelected ? "ring-1 ring-white/60 z-10" : ""}`}
              style={fx ? { background: cellBg, opacity: 0.95 } : { background: cellBg }}
              onClick={(e) => fxId && p.onSelect(fxId, e.shiftKey)}
              onDoubleClick={() => fxId && p.onRemove(fxId)}
              onDragOver={(e) => {
                const profileId = e.dataTransfer.types.includes(
                  "application/x-fixture-profile",
                );
                if (profileId) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }
              }}
              onDragEnter={(e) => {
                const profileId =
                  e.dataTransfer.getData("application/x-fixture-profile") ||
                  (e.dataTransfer.types.includes("application/x-fixture-profile")
                    ? "?"
                    : "");
                if (profileId) p.onDragEnter(address, profileId);
              }}
              onDragLeave={() => p.onDragLeave()}
              onDrop={(e) => {
                e.preventDefault();
                const profileId = e.dataTransfer.getData(
                  "application/x-fixture-profile",
                );
                if (profileId) p.onDrop(address, profileId);
              }}
              title={
                fx
                  ? `${fx.name} · ${profile?.model} · ${fx.address}–${fx.address + (profile?.footprint ?? 1) - 1}`
                  : `Ch ${address}`
              }
            >
              {isFirst && profile ? (
                <span className="absolute inset-0 flex items-center px-1 truncate font-semibold text-[10px]">
                  {fx.name}
                </span>
              ) : !fx ? (
                address % 8 === 1 ? address : ""
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
