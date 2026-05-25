import { useEffect } from "react";
import { TitleBar } from "./shell/TitleBar";
import { StatusBar } from "./shell/StatusBar";
import { OutputsDrawer } from "./shell/OutputsDrawer";
import { SetupMode } from "./modes/setup/SetupMode";
import { DesignMode } from "./modes/design/DesignMode";
import { LiveMode } from "./modes/live/LiveMode";
import { useEngine } from "../stores/engineStore";
import { useUiStore } from "../stores/uiStore";

export function App() {
  const mode = useUiStore((s) => s.mode);
  const bindEngineEvents = useEngine((s) => s.bindEngineEvents);

  useEffect(() => {
    const unlistenPromise = bindEngineEvents();
    return () => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, [bindEngineEvents]);

  return (
    <div className="app-window h-screen w-screen flex flex-col relative overflow-hidden">
      <TitleBar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {mode === "setup" && <SetupMode />}
        {mode === "design" && <DesignMode />}
        {mode === "live" && <LiveMode />}
      </main>

      <StatusBar />
      <OutputsDrawer />
    </div>
  );
}
