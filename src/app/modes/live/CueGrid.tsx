import { useCueStore } from "../../../stores/cueStore";

const ROWS = 4;
const COLS = 8;

export function CueGrid() {
  const cues = useCueStore((s) => s.cues);
  const activeId = useCueStore((s) => s.activeId);
  const addCue = useCueStore((s) => s.addCue);
  const fireCue = useCueStore((s) => s.fireCue);
  const removeCue = useCueStore((s) => s.removeCue);

  const cueAt = (row: number, col: number) =>
    cues.find((c) => c.row === row && c.col === col);

  return (
    <div className="flex-1 panel-flat overflow-hidden flex flex-col">
      <div className="panel-header justify-between">
        <span>Cue Stack</span>
        <span className="text-text-dim/40 text-[10px]">
          {cues.length} cues
        </span>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <div
          className="grid gap-3 h-full"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: ROWS * COLS }).map((_, idx) => {
            const row = Math.floor(idx / COLS);
            const col = idx % COLS;
            const cue = cueAt(row, col);
            const isActive = cue && cue.id === activeId;

            if (!cue) {
              return (
                <button
                  key={idx}
                  onClick={() => addCue(row, col)}
                  className="rounded-md border border-dashed border-border text-muted-2 hover:text-text-dim
                             hover:border-border-strong hover:bg-white/2 transition-all text-2xl"
                >
                  +
                </button>
              );
            }

            return (
              <button
                key={cue.id}
                onClick={() => fireCue(cue.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  removeCue(cue.id);
                }}
                className={`relative rounded-md border transition-all overflow-hidden
                            flex flex-col items-center justify-center gap-1 px-2 active:scale-[0.98]
                            ${
                              isActive
                                ? "border-white/60 shadow-glow"
                                : "border-border hover:border-border-strong"
                            }`}
                style={{
                  background: isActive
                    ? `radial-gradient(circle at 50% 30%, ${cue.color}, ${cue.color}88 60%, ${cue.color}44 100%)`
                    : `linear-gradient(180deg, ${cue.color}22, ${cue.color}11)`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-md shadow-panel-sm"
                  style={{ background: cue.color }}
                />
                <div className="text-[12px] font-medium text-white drop-shadow">
                  {cue.label}
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-glow" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
