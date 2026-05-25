//! Output abstraction: anything that can ship a single universe of DMX data.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::universe::UniverseId;

/// Stable handle for an output configured at runtime.
pub type OutputId = Uuid;

/// Classification used for UI / serialization.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum OutputKind {
    ArtNet,
    Sacn,
    EnttecOpenDmx,
    EnttecUsbPro,
}

/// Describes a registered output for UI listings.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputDescriptor {
    pub id: OutputId,
    pub kind: OutputKind,
    pub label: String,
    pub universe: UniverseId,
}

/// Trait implemented by every concrete DMX driver.
///
/// `write_universe` is called from the 44 Hz output loop and **must not
/// block** for more than a few milliseconds.  Implementations should buffer
/// internally and return errors lazily through `tracing`.
pub trait DmxOutput: Send {
    /// Universe index this output is bound to.
    fn universe(&self) -> UniverseId;

    /// Push a fresh frame of 512 bytes to the wire.
    fn write_universe(&mut self, data: &[u8; 512]) -> anyhow::Result<()>;

    /// Human-readable description for UI.
    fn descriptor(&self) -> OutputDescriptor;
}
