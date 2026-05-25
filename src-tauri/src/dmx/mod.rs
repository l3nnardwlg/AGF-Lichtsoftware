//! DMX subsystem.
//!
//! Provides:
//! * [`universe::Universe`] – owned 512-byte buffer per DMX universe.
//! * [`output::DmxOutput`]  – trait for any device that can ship a universe
//!   over the wire (Art-Net, sACN, Enttec USB, …).
//! * [`artnet`], [`enttec`] – concrete output implementations.
//!
//! The merger is part of the [`crate::engine`] module since it owns the
//! authoritative state of all layers (programmer, cuelists, effects …).

pub mod artnet;
pub mod enttec;
pub mod output;
pub mod universe;

pub use output::{DmxOutput, OutputDescriptor, OutputId, OutputKind};
pub use universe::{Universe, UNIVERSE_SIZE};
