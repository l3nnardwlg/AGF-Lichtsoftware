import { StageVisualizer } from "./StageVisualizer";
import { DeviceInspector } from "./DeviceInspector";
import { PresetPalette } from "./PresetPalette";

export function DesignMode() {
  return (
    <div className="flex-1 flex flex-col gap-3 p-3 overflow-hidden">
      <div className="flex-1 flex gap-3 overflow-hidden">
        <StageVisualizer />
        <PresetPalette />
      </div>
      <DeviceInspector />
    </div>
  );
}
