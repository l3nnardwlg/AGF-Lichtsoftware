//! Show Engine — authoritative real-time state for AGF Light.
//!
//! ## Thread-safety design
//!
//! `ShowEngine` must be `Send + Sync` so Tauri can manage it behind an `Arc`.
//! The key constraint is that `Box<dyn DmxOutput>` is `Send` but **not**
//! `Sync` (e.g. `serialport::SerialPort` doesn't implement `Sync`).
//!
//! Solution — split state into three independently-locked pieces:
//! * `programmer`:  `parking_lot::RwLock<Vec<Universe>>`
//!   – `Universe` is `[u8; 512]` → `Send + Sync` → `RwLock` is `Sync` ✓
//! * `grand_master`: `AtomicU8`  → `Send + Sync` ✓
//! * `blackout`:     `AtomicBool` → `Send + Sync` ✓
//! * `outputs`:      `parking_lot::Mutex<Vec<Box<dyn DmxOutput>>>`
//!   – `parking_lot::Mutex<T>: Sync` when `T: Send` (not `T: Sync`) ✓
//!
//! The 44 Hz output loop runs on a **dedicated OS thread** (not a Tokio
//! task) so blocking serial/UDP writes cannot starve the async executor.

use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use parking_lot::{Mutex, RwLock};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

use crate::dmx::output::{DmxOutput, OutputDescriptor, OutputId};
use crate::dmx::universe::{Universe, UniverseId, UniverseSnapshot, UNIVERSE_SIZE};

pub const MAX_UNIVERSES: usize = 32;
const TICK_HZ: u64 = 44;
const TICK_PERIOD: Duration = Duration::from_micros(1_000_000 / TICK_HZ);

/// Authoritative engine state.
///
/// `ShowEngine: Send + Sync` — see module-level docs for the reasoning.
pub struct ShowEngine {
    /// Programmer layer (direct channel writes from UI).
    programmer: RwLock<Vec<Universe>>,
    /// 0..=255 grand-master level applied before output.
    grand_master: AtomicU8,
    /// True → all channels forced to 0.
    blackout: AtomicBool,
    /// Registered DMX output drivers.
    /// `parking_lot::Mutex<T>: Sync` when `T: Send` – no `Sync` needed on T.
    outputs: Mutex<Vec<Box<dyn DmxOutput>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineSnapshot {
    pub universes: Vec<UniverseSnapshot>,
    pub outputs: Vec<OutputDescriptor>,
    pub grand_master: u8,
    pub blackout: bool,
}

impl ShowEngine {
    pub fn new() -> Self {
        let programmer: Vec<Universe> = (0..MAX_UNIVERSES as u16)
            .map(Universe::new)
            .collect();

        Self {
            programmer: RwLock::new(programmer),
            grand_master: AtomicU8::new(255),
            blackout: AtomicBool::new(false),
            outputs: Mutex::new(Vec::new()),
        }
    }

    // ---------------- Programmer ----------------

    pub fn set_channel(&self, universe: UniverseId, address: u16, value: u8) {
        let mut prog = self.programmer.write();
        if let Some(u) = prog.get_mut(universe as usize) {
            u.set(address, value);
        }
    }

    pub fn set_grand_master(&self, value: u8) {
        self.grand_master.store(value, Ordering::Relaxed);
    }

    pub fn set_blackout(&self, value: bool) {
        self.blackout.store(value, Ordering::Relaxed);
    }

    // ---------------- Outputs ----------------

    pub fn add_output(&self, output: Box<dyn DmxOutput>) -> OutputDescriptor {
        let desc = output.descriptor();
        self.outputs.lock().push(output);
        desc
    }

    pub fn remove_output(&self, id: OutputId) -> bool {
        let mut outputs = self.outputs.lock();
        let before = outputs.len();
        outputs.retain(|o| o.descriptor().id != id);
        outputs.len() < before
    }

    pub fn list_outputs(&self) -> Vec<OutputDescriptor> {
        self.outputs.lock().iter().map(|o| o.descriptor()).collect()
    }

    // ---------------- Snapshot ----------------

    pub fn snapshot(&self) -> EngineSnapshot {
        let prog = self.programmer.read();
        EngineSnapshot {
            universes: prog.iter().map(UniverseSnapshot::from).collect(),
            outputs: self.outputs.lock().iter().map(|o| o.descriptor()).collect(),
            grand_master: self.grand_master.load(Ordering::Relaxed),
            blackout: self.blackout.load(Ordering::Relaxed),
        }
    }

    // ---------------- Output loop ----------------

    /// Spawn the 44 Hz output loop on a dedicated OS thread.
    ///
    /// The thread blocks on `std::thread::sleep` for precise timing without
    /// tying up Tokio executor threads.  It emits `engine-tick` at ~10 Hz
    /// to the UI.
    pub fn spawn_output_loop(self: Arc<Self>, app: AppHandle) {
        std::thread::Builder::new()
            .name("agf-dmx-output".to_owned())
            .spawn(move || Self::output_loop_thread(self, app))
            .expect("failed to spawn DMX output thread");
    }

    fn output_loop_thread(engine: Arc<Self>, app: AppHandle) {
        let mut frame_counter: u32 = 0;
        const UI_THROTTLE: u32 = TICK_HZ as u32 / 10; // emit to UI at ~10 Hz
        let mut merged = [0u8; UNIVERSE_SIZE];

        loop {
            let tick_start = Instant::now();

            let gm = engine.grand_master.load(Ordering::Relaxed) as u16;
            let blackout = engine.blackout.load(Ordering::Relaxed);

            // Hold programmer read-lock only while copying channel data.
            // Hold outputs mutex for the entire write pass (prevents concurrent
            // add/remove mid-frame, which is fine – those are rare UI actions).
            {
                let prog = engine.programmer.read();
                let mut outputs = engine.outputs.lock();

                for output in outputs.iter_mut() {
                    let uni = output.universe() as usize;
                    if let Some(src) = prog.get(uni) {
                        if blackout || gm == 0 {
                            merged.fill(0);
                        } else if gm == 255 {
                            merged.copy_from_slice(&src.data);
                        } else {
                            for (dst, &v) in merged.iter_mut().zip(src.data.iter()) {
                                *dst = ((v as u16 * gm) / 255) as u8;
                            }
                        }
                    } else {
                        merged.fill(0);
                    }

                    if let Err(e) = output.write_universe(&merged) {
                        tracing::warn!("dmx output write failed: {e:#}");
                    }
                }
            }

            // Throttled UI event – best-effort, never blocks the output loop.
            frame_counter = frame_counter.wrapping_add(1);
            if frame_counter % UI_THROTTLE == 0 {
                let snap = engine.snapshot();
                let _ = app.emit("engine-tick", &snap);
            }

            // Sleep for the remainder of the tick window.
            let elapsed = tick_start.elapsed();
            if let Some(remaining) = TICK_PERIOD.checked_sub(elapsed) {
                std::thread::sleep(remaining);
            }
        }
    }
}

impl Default for ShowEngine {
    fn default() -> Self {
        Self::new()
    }
}
