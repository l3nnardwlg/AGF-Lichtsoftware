import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUiStore } from "../../stores/uiStore";

const win = getCurrentWindow();

export function TitleBar() {
  const mode = useUiStore((s) => s.mode);
  const setMode = useUiStore((s) => s.setMode);
  const toggleOutputs = useUiStore((s) => s.toggleOutputs);
  const [isMax, setIsMax] = useState(false);

  useEffect(() => {
    win.isMaximized().then(setIsMax).catch(() => {});
    const unlisten = win.onResized(() => {
      win.isMaximized().then(setIsMax).catch(() => {});
    });
    return () => {
      unlisten.then((u) => u()).catch(() => {});
    };
  }, []);

  return (
    <header
      data-tauri-drag-region
      className="h-11 flex items-center px-3 gap-3 bg-panel/80 backdrop-blur-macos border-b border-border select-none"
    >
      {/* App brand */}
      <div data-tauri-drag-region className="flex items-center gap-2 pl-1">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-accent to-accent-dim shadow-glow" />
        <span data-tauri-drag-region className="text-[13px] font-semibold tracking-tight">
          AGF Light
        </span>
      </div>

      <div data-tauri-drag-region className="w-px h-5 bg-border" />

      {/* Project / show file name */}
      <div data-tauri-drag-region className="text-[12px] text-muted">
        Untitled Show
      </div>

      {/* Mode picker — centered */}
      <div data-tauri-drag-region className="flex-1 flex justify-center">
        <div className="segmented no-drag">
          <button
            data-active={mode === "setup"}
            onClick={() => setMode("setup")}
          >
            Setup
          </button>
          <button
            data-active={mode === "design"}
            onClick={() => setMode("design")}
          >
            Design
          </button>
          <button
            data-active={mode === "live"}
            onClick={() => setMode("live")}
          >
            Live
          </button>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1 no-drag">
        <button className="btn-ghost" onClick={toggleOutputs} title="DMX Outputs">
          <DmxIcon />
        </button>
        <button className="btn-ghost" title="Preferences">
          <CogIcon />
        </button>
      </div>

      {/* Window controls */}
      <div className="flex items-center gap-1 no-drag pl-1">
        <WindowButton onClick={() => win.minimize()} title="Minimize">
          <MinIcon />
        </WindowButton>
        <WindowButton
          onClick={() => win.toggleMaximize()}
          title={isMax ? "Restore" : "Maximize"}
        >
          {isMax ? <RestoreIcon /> : <MaxIcon />}
        </WindowButton>
        <WindowButton onClick={() => win.close()} title="Close" variant="close">
          <CloseIcon />
        </WindowButton>
      </div>
    </header>
  );
}

function WindowButton({
  children,
  onClick,
  title,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  variant?: "close";
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-7 inline-flex items-center justify-center rounded-sm text-text-dim
                  hover:text-text transition-colors ${
                    variant === "close"
                      ? "hover:bg-err/80 hover:text-white"
                      : "hover:bg-white/8"
                  }`}
    >
      {children}
    </button>
  );
}

const IconBase = ({ children }: { children: React.ReactNode }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    {children}
  </svg>
);

const MinIcon = () => (
  <IconBase>
    <path d="M3 7h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </IconBase>
);
const MaxIcon = () => (
  <IconBase>
    <rect x="3" y="3" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
  </IconBase>
);
const RestoreIcon = () => (
  <IconBase>
    <rect x="3" y="4.5" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 4.5V3.2A1 1 0 016 2.2h4.8a1 1 0 011 1V8A1 1 0 0110.8 9H9.5" stroke="currentColor" strokeWidth="1.3" />
  </IconBase>
);
const CloseIcon = () => (
  <IconBase>
    <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </IconBase>
);
const CogIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
const DmxIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M4 8h.5M6.5 8H7M9 8h.5M11.5 8h.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
