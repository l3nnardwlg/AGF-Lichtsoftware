import { useMemo, useState } from "react";
import { usePatchStore } from "../../../stores/patchStore";

/** Inspector for currently selected fixtures.
 *  Phase A: visual controls only — wiring to live DMX comes next phase.
 */
export function DeviceInspector() {
  const fixtures = usePatchStore((s) => s.fixtures);
  const profiles = usePatchStore((s) => s.profiles);
  const selectedIds = usePatchStore((s) => s.selectedIds);
  const clearSelection = usePatchStore((s) => s.clearSelection);

  const selected = useMemo(
    () => fixtures.filter((f) => selectedIds.includes(f.id)),
    [fixtures, selectedIds],
  );

  const profileSet = useMemo(
    () => new Set(selected.map((f) => f.profileId)),
    [selected],
  );

  if (selected.length === 0) {
    return (
      <section className="h-44 panel-flat flex items-center justify-center text-muted text-[12px]">
        Select fixtures in the stage or universe grid to inspect.
      </section>
    );
  }

  const heterogeneous = profileSet.size > 1;
  const profile = heterogeneous
    ? null
    : profiles.find((p) => p.id === selected[0]!.profileId);

  return (
    <section className="h-44 panel-flat flex flex-col overflow-hidden">
      <div className="panel-header justify-between">
        <div className="flex items-center gap-2">
          <span>Inspector</span>
          <span className="pill">
            {selected.length} selected
            {profile && ` · ${profile.model}`}
            {heterogeneous && " · mixed"}
          </span>
        </div>
        <button className="btn-ghost btn-sm" onClick={clearSelection}>
          Deselect
        </button>
      </div>

      <div className="flex-1 flex gap-4 px-4 py-3 overflow-x-auto">
        <DimmerBlock />
        <ColorBlock />
        <PanTiltBlock />
        <GoboBlock />
      </div>
    </section>
  );
}

function DimmerBlock() {
  const [v, setV] = useState(255);
  return (
    <ControlBlock label="Dimmer">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={255}
          value={v}
          onChange={(e) => setV(Number(e.target.value))}
          className="w-40 accent-accent"
        />
        <span className="font-mono text-[11px] w-8 text-right text-text">
          {Math.round((v / 255) * 100)}%
        </span>
      </div>
    </ControlBlock>
  );
}

function ColorBlock() {
  const [c, setC] = useState("#ff8a3a");
  return (
    <ControlBlock label="Color">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={c}
          onChange={(e) => setC(e.target.value)}
          className="w-9 h-9 rounded bg-transparent border border-border cursor-pointer"
        />
        <div className="text-[11px] text-muted font-mono">{c.toUpperCase()}</div>
      </div>
      <div className="mt-1 flex gap-1">
        {["#ff453a", "#ff9f0a", "#ffd60a", "#30d158", "#64d2ff", "#007aff", "#bf5af2", "#ffffff"].map(
          (sw) => (
            <button
              key={sw}
              onClick={() => setC(sw)}
              className="w-4 h-4 rounded-xs border border-border hover:scale-110 transition-transform"
              style={{ background: sw }}
            />
          ),
        )}
      </div>
    </ControlBlock>
  );
}

function PanTiltBlock() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  return (
    <ControlBlock label="Pan / Tilt">
      <div
        className="relative w-24 h-24 bg-black/40 rounded border border-border cursor-crosshair"
        onPointerDown={(e) => {
          const update = (ev: PointerEvent | React.PointerEvent) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
            setPos({ x, y });
          };
          update(e);
          const onMove = (ev: PointerEvent) => update(ev);
          const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        }}
      >
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border-r border-b border-white/40" />
          ))}
        </div>
        {/* crosshair */}
        <div
          className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-glow"
          style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
        />
        <div className="absolute left-0 right-0 h-px bg-white/15" style={{ top: `${pos.y * 100}%` }} />
        <div className="absolute top-0 bottom-0 w-px bg-white/15" style={{ left: `${pos.x * 100}%` }} />
      </div>
      <div className="mt-1 text-[10px] font-mono text-muted">
        P {Math.round(pos.x * 100)}% &nbsp; T {Math.round(pos.y * 100)}%
      </div>
    </ControlBlock>
  );
}

function GoboBlock() {
  return (
    <ControlBlock label="Gobo / Prism">
      <select className="input">
        <option>Open</option>
        <option>Gobo 1 – Dots</option>
        <option>Gobo 2 – Star</option>
        <option>Gobo 3 – Breakup</option>
        <option>Gobo 4 – Tunnel</option>
      </select>
      <select className="input mt-1">
        <option>Prism Off</option>
        <option>3-Facet</option>
        <option>5-Facet Rotate</option>
      </select>
    </ControlBlock>
  );
}

function ControlBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      {children}
    </div>
  );
}
