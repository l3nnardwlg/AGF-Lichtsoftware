import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  value: number; // 0..255
  onChange: (next: number) => void;
  label?: string;
  sublabel?: string;
  height?: number;
  accent?: "default" | "master";
}

/**
 * Vertical DMX fader.  Click anywhere on the track to jump, drag to scrub.
 * Designed for both mouse and touch — uses pointer events.
 */
export function Fader({
  value,
  onChange,
  label,
  sublabel,
  height = 220,
  accent = "default",
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const pct = (value / 255) * 100;

  const updateFromEvent = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = 1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      onChange(Math.round(ratio * 255));
    },
    [onChange]
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => updateFromEvent(e.clientY);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, updateFromEvent]);

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {label && (
        <div className="text-[10px] uppercase tracking-widest text-muted font-mono">
          {label}
        </div>
      )}
      <div
        ref={trackRef}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setDragging(true);
          updateFromEvent(e.clientY);
        }}
        className={clsx(
          "relative w-7 rounded-full bg-base border border-border cursor-pointer touch-none",
          dragging && "ring-1 ring-accent"
        )}
        style={{ height }}
      >
        {/* fill */}
        <div
          className={clsx(
            "absolute left-0 right-0 bottom-0 rounded-full transition-[height] duration-75",
            accent === "master"
              ? "bg-gradient-to-t from-err via-warn to-ok"
              : "bg-gradient-to-t from-accent-lo to-accent-hi"
          )}
          style={{ height: `${pct}%` }}
        />
        {/* thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-9 h-3 rounded-sm bg-elevated border border-border shadow-md"
          style={{ bottom: `calc(${pct}% - 6px)` }}
        />
      </div>
      <div className="text-xs font-mono tabular-nums">{value}</div>
      {sublabel && <div className="text-[10px] text-muted">{sublabel}</div>}
    </div>
  );
}
