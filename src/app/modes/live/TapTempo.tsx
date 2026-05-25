import { useEffect, useState } from "react";
import { useCueStore } from "../../../stores/cueStore";

export function TapTempo() {
  const bpm = useCueStore((s) => s.bpm);
  const tap = useCueStore((s) => s.tap);
  const reset = useCueStore((s) => s.resetBpm);
  const [pulse, setPulse] = useState(false);

  // Drive a visual pulse using the BPM
  useEffect(() => {
    const interval = (60_000 / bpm);
    const id = window.setInterval(() => setPulse((p) => !p), interval);
    return () => window.clearInterval(id);
  }, [bpm]);

  // Keyboard 'T' tap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "t" || e.key === "T") tap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={tap}
        className="w-20 h-20 rounded-full bg-panel-2 border border-border hover:bg-panel-3
                   active:scale-95 transition-all relative flex items-center justify-center
                   text-text font-mono"
      >
        <span
          className="absolute inset-1 rounded-full pointer-events-none transition-all"
          style={{
            background: pulse
              ? "radial-gradient(circle, rgba(0,122,255,0.5), transparent 70%)"
              : "transparent",
            transitionDuration: `${Math.min(180, 30000 / bpm)}ms`,
          }}
        />
        <span className="relative text-lg font-semibold">{bpm.toFixed(0)}</span>
      </button>
      <div className="flex flex-col">
        <div className="text-[10px] uppercase tracking-wider text-muted">Tap Tempo</div>
        <div className="text-[11px] text-text-dim">BPM · press <span className="kbd">T</span></div>
        <button onClick={reset} className="btn-ghost btn-sm mt-1 self-start">
          Reset
        </button>
      </div>
    </div>
  );
}
