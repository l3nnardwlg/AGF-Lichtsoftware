import { useState } from "react";
import { FixtureLibrary } from "./FixtureLibrary";
import { UniverseGrid } from "./UniverseGrid";

export function SetupMode() {
  const [, setDraggingProfile] = useState<string | null>(null);

  return (
    <div className="flex-1 flex gap-3 p-3 overflow-hidden">
      <FixtureLibrary onDragStart={setDraggingProfile} />
      <UniverseGrid />
    </div>
  );
}
