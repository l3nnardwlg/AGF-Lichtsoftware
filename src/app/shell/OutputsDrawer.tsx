import { useEffect, useState } from "react";
import { api, type SerialPortInfo } from "../../ipc/api";
import { useEngine } from "../../stores/engineStore";
import { useUiStore } from "../../stores/uiStore";

/** Slide-out drawer for managing physical DMX outputs (Art-Net + Enttec). */
export function OutputsDrawer() {
  const open = useUiStore((s) => s.outputsDrawerOpen);
  const toggle = useUiStore((s) => s.toggleOutputs);
  const outputs = useEngine((s) => s.outputs);

  const [serial, setSerial] = useState<SerialPortInfo[]>([]);
  const [artIp, setArtIp] = useState("255.255.255.255");
  const [artUni, setArtUni] = useState(0);
  const [enttecPort, setEnttecPort] = useState("");
  const [enttecUni, setEnttecUni] = useState(0);
  const [usbProPort, setUsbProPort] = useState("");
  const [usbProUni, setUsbProUni] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api.listSerialPorts().then(setSerial).catch(() => setSerial([]));
  }, [open]);

  const guard = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="absolute inset-0 bg-black/40 z-30"
          onClick={toggle}
        />
      )}
      <div
        className={`absolute top-11 bottom-0 right-0 w-[420px] bg-panel border-l border-border
                    shadow-panel z-40 transition-transform duration-200 flex flex-col
                    ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="panel-header justify-between">
          <span>DMX Outputs</span>
          <button className="btn-ghost btn-sm" onClick={toggle}>
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {err && (
            <div className="text-[12px] text-err bg-err/10 border border-err/40 rounded p-2">
              {err}
            </div>
          )}

          {/* Active outputs */}
          <Section title={`Active (${outputs.length})`}>
            {outputs.length === 0 ? (
              <Empty>No outputs configured.</Empty>
            ) : (
              <div className="space-y-1">
                {outputs.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-2 px-2 h-9 rounded bg-panel-2 border border-border"
                  >
                    <KindIcon kind={o.kind} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] truncate text-text">{o.label}</div>
                      <div className="text-[10px] text-muted">
                        Universe {o.universe + 1}
                      </div>
                    </div>
                    <button
                      onClick={() => guard(() => api.removeOutput(o.id))}
                      className="btn-ghost btn-sm text-err"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Art-Net */}
          <Section title="Add Art-Net">
            <Row>
              <Field label="IP">
                <input
                  className="input"
                  value={artIp}
                  onChange={(e) => setArtIp(e.target.value)}
                />
              </Field>
              <Field label="Universe">
                <input
                  type="number"
                  min={0}
                  max={32767}
                  className="input w-20"
                  value={artUni}
                  onChange={(e) => setArtUni(Number(e.target.value))}
                />
              </Field>
            </Row>
            <button
              disabled={busy}
              className="btn-accent mt-2 w-full"
              onClick={() => guard(() => api.addArtNet(artIp, artUni))}
            >
              Add Art-Net Output
            </button>
          </Section>

          {/* Enttec Open DMX */}
          <Section title="Add Enttec Open DMX">
            <Row>
              <Field label="Port">
                <SerialSelect
                  ports={serial}
                  value={enttecPort}
                  onChange={setEnttecPort}
                />
              </Field>
              <Field label="Universe">
                <input
                  type="number"
                  min={0}
                  max={32767}
                  className="input w-20"
                  value={enttecUni}
                  onChange={(e) => setEnttecUni(Number(e.target.value))}
                />
              </Field>
            </Row>
            <button
              disabled={busy || !enttecPort}
              className="btn-accent mt-2 w-full"
              onClick={() => guard(() => api.addEnttecOpenDmx(enttecPort, enttecUni))}
            >
              Add Open DMX Output
            </button>
          </Section>

          {/* Enttec USB Pro */}
          <Section title="Add Enttec DMX USB Pro">
            <Row>
              <Field label="Port">
                <SerialSelect
                  ports={serial}
                  value={usbProPort}
                  onChange={setUsbProPort}
                />
              </Field>
              <Field label="Universe">
                <input
                  type="number"
                  min={0}
                  max={32767}
                  className="input w-20"
                  value={usbProUni}
                  onChange={(e) => setUsbProUni(Number(e.target.value))}
                />
              </Field>
            </Row>
            <button
              disabled={busy || !usbProPort}
              className="btn-accent mt-2 w-full"
              onClick={() => guard(() => api.addEnttecUsbPro(usbProPort, usbProUni))}
            >
              Add USB Pro Output
            </button>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[10px] uppercase tracking-wider text-muted mb-2">
        {title}
      </h3>
      <div className="bg-black/20 border border-border rounded p-3">{children}</div>
    </section>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2">{children}</div>
);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[12px] text-muted text-center py-2">{children}</div>
);

function SerialSelect({
  ports,
  value,
  onChange,
}: {
  ports: SerialPortInfo[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      className="input w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— Select —</option>
      {ports.map((p) => (
        <option key={p.name} value={p.name}>
          {p.name}
          {p.product ? ` · ${p.product}` : ""}
        </option>
      ))}
    </select>
  );
}

function KindIcon({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    ArtNet: "ART",
    Sacn: "sACN",
    EnttecOpenDmx: "OPEN",
    EnttecUsbPro: "PRO",
  };
  return (
    <div className="w-9 h-7 rounded-xs bg-panel-3 flex items-center justify-center text-[9px] font-mono text-text">
      {map[kind] ?? kind}
    </div>
  );
}
