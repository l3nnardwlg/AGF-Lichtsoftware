import { useEngine } from "../../../stores/engineStore";
import { CueGrid } from "./CueGrid";
import { TapTempo } from "./TapTempo";

export function LiveMode() {
  const grandMaster = useEngine((s) => s.grandMaster);
  const setGrandMaster = useEngine((s) => s.setGrandMaster);
  const blackout = useEngine((s) => s.blackout);
  const toggleBlackout = useEngine((s) => s.toggleBlackout);

  return (
    <div className="flex-1 flex gap-3 p-3 overflow-hidden">
      <CueGrid />

      <aside className="w-64 flex-shrink-0 panel-flat overflow-hidden flex flex-col">
        <div className="panel-header">Master</div>
        <div className="flex-1 flex flex-col items-center justify-between px-4 py-4">
          {/* Big vertical Grand Master fader */}
          <div className="flex flex-col items-center gap-2 flex-1 w-full">
            <div className="text-[10px] uppercase tracking-wider text-muted">Grand Master</div>
            <div className="flex-1 flex flex-col items-center gap-2 w-full">
              <input
                type="range"
                min={0}
                max={255}
                value={grandMaster}
                onChange={(e) => setGrandMaster(Number(e.target.value))}
                className="flex-1 accent-accent"
                style={{
                  writingMode: "vertical-lr" as const,
                  WebkitAppearance: "slider-vertical" as const,
                  width: "32px",
                  direction: "rtl",
                }}
              />
              <div className="font-mono text-lg text-text">
                {Math.round((grandMaster / 255) * 100)}%
              </div>
            </div>
          </div>

          <button
            onClick={toggleBlackout}
            className={`w-full h-10 rounded-md font-semibold text-sm transition-colors mt-3 ${
              blackout
                ? "bg-err text-white shadow-[0_0_18px_rgba(255,69,58,0.5)]"
                : "bg-panel-2 text-text-dim hover:bg-panel-3"
            }`}
          >
            BLACKOUT
          </button>

          <div className="w-full border-t border-border pt-3 mt-3 flex justify-center">
            <TapTempo />
          </div>
        </div>
      </aside>
    </div>
  );
}
