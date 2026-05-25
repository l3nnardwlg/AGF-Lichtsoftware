//! DMX universe buffer.

use serde::{Deserialize, Serialize};

/// A DMX universe contains 512 8-bit slots (channels 1..=512).
pub const UNIVERSE_SIZE: usize = 512;

/// Logical universe index (0-based) used throughout the engine.
pub type UniverseId = u16;

/// Owned, contiguous 512-byte buffer representing one DMX universe.
///
/// Stored as a plain array to keep the hot output loop allocation-free.
#[derive(Clone)]
pub struct Universe {
    pub id: UniverseId,
    pub data: [u8; UNIVERSE_SIZE],
}

impl Universe {
    pub fn new(id: UniverseId) -> Self {
        Self { id, data: [0u8; UNIVERSE_SIZE] }
    }

    /// Set a single channel (1-based DMX address).
    #[inline]
    pub fn set(&mut self, address: u16, value: u8) {
        if address >= 1 && (address as usize) <= UNIVERSE_SIZE {
            self.data[(address as usize) - 1] = value;
        }
    }

    /// Get a single channel (1-based DMX address).
    #[inline]
    pub fn get(&self, address: u16) -> u8 {
        if address >= 1 && (address as usize) <= UNIVERSE_SIZE {
            self.data[(address as usize) - 1]
        } else {
            0
        }
    }

    /// Zero all channels.
    pub fn clear(&mut self) {
        self.data.fill(0);
    }
}

/// Lightweight snapshot used for IPC to the UI.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UniverseSnapshot {
    pub id: UniverseId,
    /// 512 bytes – serialised as a JSON number array.
    pub data: Vec<u8>,
}

impl From<&Universe> for UniverseSnapshot {
    fn from(u: &Universe) -> Self {
        Self { id: u.id, data: u.data.to_vec() }
    }
}
