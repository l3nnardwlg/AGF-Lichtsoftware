import { useEngine } from "../../stores/engineStore";
import { usePatchStore } from "../../stores/patchStore";

export function StatusBar() {
  const ready = useEngine((s) => s.ready);
  const grandMaster = useEngine((s) => s.grandMaster);
  const blackout = useEngine((s) => s.blackout);
  const outputs = useEngine((s) => s.outputs);
  const setGrandMaster = useEngine((s) => s.setGrandMaster);
  const toggleBlackout = useEngine((s) => s.toggleBlackout);
  const fixtures = usePatchStore((s) => s.fixtures);

  return (
    <footer className="h-8 flex items-center px-3 gap-3 bg-panel/80 backdrop-blur-macos border-t border-border text-[11px] text-muted">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            ready ? "bg-ok shadow-[0_0_6px_rgba(48,209,88,0.7)]" : "bg-err"
          }`}
        />
        <span className="text-text-dim">{ready ? "Engine 44 Hz" : "Engine offline"}</span>
      </div>

      <Sep />

      <span>{outputs.length} output{outputs.length !== 1 && "s"}</span>
      <Sep />
      <span>{fixtures.length} fixture{fixtures.length !== 1 && "s"}</span>

      <div className="flex-1" />

      {/* Grand Master inline slider */}
      <div className="flex items-center gap-2">
        <span className="text-muted">GM</span>
        <input
          type="range"
          min={0}
          max={255}
          value={grandMaster}
          onChange={(e) => setGrandMaster(Number(e.target.value))}
          className="w-36 accent-accent h-1"
        />
        <span className="font-mono text-text w-9 text-right">
          {Math.round((grandMaster / 255) * 100)}%
        </span>
      </div>

      <Sep />

      <button
        onClick={toggleBlackout}
        className={`px-2 h-6 rounded-sm text-[11px] font-medium transition-colors ${
          blackout
            ? "bg-err text-white"
            : "bg-panel-2 text-text-dim hover:bg-panel-3"
        }`}
      >
        BLACKOUT
      </button>
    </footer>
  );
}

const Sep = () => <span className="w-px h-3 bg-border" />;
