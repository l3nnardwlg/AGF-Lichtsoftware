/**
 * Type-safe wrappers around Tauri IPC.
 *
 * Centralizing the calls here keeps the rest of the app free of the raw
 * `invoke` import and gives us a single place to evolve the wire protocol.
 */
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface UniverseSnapshot {
  id: number;
  data: number[]; // 512 bytes
}

export type OutputKind =
  | "art-net"
  | "sacn"
  | "enttec-open-dmx"
  | "enttec-usb-pro";

export interface OutputDescriptor {
  id: string;
  kind: OutputKind;
  label: string;
  universe: number;
}

export interface EngineSnapshot {
  universes: UniverseSnapshot[];
  outputs: OutputDescriptor[];
  grandMaster: number;
  blackout: boolean;
}

export interface SerialPortInfo {
  name: string;
  vid: number | null;
  pid: number | null;
  manufacturer: string | null;
  product: string | null;
}

// Rust serializes EngineSnapshot with snake_case fields; map to camelCase.
interface RawEngineSnapshot {
  universes: UniverseSnapshot[];
  outputs: OutputDescriptor[];
  grand_master: number;
  blackout: boolean;
}

const toSnapshot = (raw: RawEngineSnapshot): EngineSnapshot => ({
  universes: raw.universes,
  outputs: raw.outputs,
  grandMaster: raw.grand_master,
  blackout: raw.blackout,
});

export const api = {
  async getSnapshot(): Promise<EngineSnapshot> {
    const raw = await invoke<RawEngineSnapshot>("get_state_snapshot");
    return toSnapshot(raw);
  },
  setChannel(universe: number, address: number, value: number): Promise<void> {
    return invoke("set_channel", { universe, address, value });
  },
  setGrandMaster(value: number): Promise<void> {
    return invoke("set_grand_master", { value });
  },
  blackout(value: boolean): Promise<void> {
    return invoke("blackout", { value });
  },
  listOutputs(): Promise<OutputDescriptor[]> {
    return invoke("list_outputs");
  },
  removeOutput(id: string): Promise<boolean> {
    return invoke("remove_output", { id });
  },
  addArtNet(ip: string, universe: number, label?: string): Promise<OutputDescriptor> {
    return invoke("add_artnet_output", { ip, universe, label });
  },
  listSerialPorts(): Promise<SerialPortInfo[]> {
    return invoke("list_serial_ports");
  },
  addEnttecOpenDmx(port: string, universe: number, label?: string): Promise<OutputDescriptor> {
    return invoke("add_enttec_open_dmx_output", { port, universe, label });
  },
  addEnttecUsbPro(port: string, universe: number, label?: string): Promise<OutputDescriptor> {
    return invoke("add_enttec_usb_pro_output", { port, universe, label });
  },
  onEngineTick(handler: (snap: EngineSnapshot) => void): Promise<UnlistenFn> {
    return listen<RawEngineSnapshot>("engine-tick", (e) => handler(toSnapshot(e.payload)));
  },
};
