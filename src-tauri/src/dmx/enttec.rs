//! Enttec Open DMX USB and DMX USB Pro drivers.
//!
//! ## Open DMX USB
//! A pure FTDI device that requires the host to bit-bang the DMX timing.
//! We approximate the protocol with the standard `serialport` crate:
//!  * 250 000 baud, 8N2, no parity
//!  * Break (≥ 88 µs) + Mark-After-Break (≥ 8 µs) emitted via
//!    `set_break`/`clear_break`
//!  * 513 bytes payload: `[0x00, ch1, ch2 … ch512]` (start code 0)
//!
//! Timing on Open DMX is best-effort and *will* glitch under heavy CPU load.
//! For reliable output, prefer the **DMX USB Pro**.
//!
//! ## DMX USB Pro
//! Speaks a framed protocol with embedded break generation in firmware.
//! Frame format:
//! ```text
//! 0x7E <label> <len_lo> <len_hi> <payload…> 0xE7
//! ```
//! Label `6` = "Output Only Send DMX Packet Request".  Payload is the
//! 513-byte DMX frame (start code + 512 slots).

use std::io::Write;
use std::time::Duration;

use anyhow::Context;
use serialport::{SerialPort, SerialPortType};
use uuid::Uuid;

use super::output::{DmxOutput, OutputDescriptor, OutputId, OutputKind};
use super::universe::UniverseId;

/// List serial ports the OS knows about. UI surfaces these so the user can
/// pick the right COM port.
pub fn list_ports() -> Vec<SerialPortInfo> {
    serialport::available_ports()
        .unwrap_or_default()
        .into_iter()
        .map(|p| {
            let (vid, pid, manufacturer, product) = match &p.port_type {
                SerialPortType::UsbPort(info) => (
                    Some(info.vid),
                    Some(info.pid),
                    info.manufacturer.clone(),
                    info.product.clone(),
                ),
                _ => (None, None, None, None),
            };
            SerialPortInfo {
                name: p.port_name,
                vid,
                pid,
                manufacturer,
                product,
            }
        })
        .collect()
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SerialPortInfo {
    pub name: String,
    pub vid: Option<u16>,
    pub pid: Option<u16>,
    pub manufacturer: Option<String>,
    pub product: Option<String>,
}

// ---------------------------------------------------------------------------
// Open DMX USB
// ---------------------------------------------------------------------------

pub struct EnttecOpenDmxOutput {
    id: OutputId,
    label: String,
    universe: UniverseId,
    port: Box<dyn SerialPort>,
    payload: [u8; 513],
}

impl EnttecOpenDmxOutput {
    pub fn open(port_name: &str, universe: UniverseId, label: impl Into<String>) -> anyhow::Result<Self> {
        let port = serialport::new(port_name, 250_000)
            .data_bits(serialport::DataBits::Eight)
            .stop_bits(serialport::StopBits::Two)
            .parity(serialport::Parity::None)
            .flow_control(serialport::FlowControl::None)
            .timeout(Duration::from_millis(20))
            .open()
            .with_context(|| format!("open serial port {port_name}"))?;

        Ok(Self {
            id: Uuid::new_v4(),
            label: label.into(),
            universe,
            port,
            payload: [0u8; 513],
        })
    }
}

impl DmxOutput for EnttecOpenDmxOutput {
    fn universe(&self) -> UniverseId {
        self.universe
    }

    fn write_universe(&mut self, data: &[u8; 512]) -> anyhow::Result<()> {
        // Construct frame: start code 0x00 + 512 channels.
        self.payload[0] = 0x00;
        self.payload[1..].copy_from_slice(data);

        // DMX BREAK: hold TX low for >=88 µs, then MAB >=8 µs.  `serialport`
        // doesn't expose nanosecond-accurate timing; this is "good enough"
        // for typical Open DMX dongles.
        self.port.set_break().ok();
        std::thread::sleep(Duration::from_micros(100));
        self.port.clear_break().ok();
        std::thread::sleep(Duration::from_micros(12));

        self.port.write_all(&self.payload)?;
        Ok(())
    }

    fn descriptor(&self) -> OutputDescriptor {
        OutputDescriptor {
            id: self.id,
            kind: OutputKind::EnttecOpenDmx,
            label: self.label.clone(),
            universe: self.universe,
        }
    }
}

// ---------------------------------------------------------------------------
// DMX USB Pro
// ---------------------------------------------------------------------------

const PRO_START_DELIMITER: u8 = 0x7E;
const PRO_END_DELIMITER: u8 = 0xE7;
const PRO_LABEL_OUTPUT_DMX: u8 = 6;

pub struct EnttecUsbProOutput {
    id: OutputId,
    label: String,
    universe: UniverseId,
    port: Box<dyn SerialPort>,
    /// Frame buffer: header(4) + payload(513) + footer(1) = 518.
    frame: [u8; 4 + 513 + 1],
}

impl EnttecUsbProOutput {
    pub fn open(port_name: &str, universe: UniverseId, label: impl Into<String>) -> anyhow::Result<Self> {
        // DMX USB Pro speaks at 57600 baud for command framing; the firmware
        // generates DMX timing internally regardless of host scheduling.
        let port = serialport::new(port_name, 57_600)
            .data_bits(serialport::DataBits::Eight)
            .stop_bits(serialport::StopBits::One)
            .parity(serialport::Parity::None)
            .flow_control(serialport::FlowControl::None)
            .timeout(Duration::from_millis(20))
            .open()
            .with_context(|| format!("open serial port {port_name}"))?;

        let mut frame = [0u8; 4 + 513 + 1];
        frame[0] = PRO_START_DELIMITER;
        frame[1] = PRO_LABEL_OUTPUT_DMX;
        frame[2] = 513u16.to_le_bytes()[0];
        frame[3] = 513u16.to_le_bytes()[1];
        frame[4] = 0x00; // DMX start code
        frame[4 + 513] = PRO_END_DELIMITER;

        Ok(Self {
            id: Uuid::new_v4(),
            label: label.into(),
            universe,
            port,
            frame,
        })
    }
}

impl DmxOutput for EnttecUsbProOutput {
    fn universe(&self) -> UniverseId {
        self.universe
    }

    fn write_universe(&mut self, data: &[u8; 512]) -> anyhow::Result<()> {
        self.frame[5..5 + 512].copy_from_slice(data);
        self.port.write_all(&self.frame)?;
        Ok(())
    }

    fn descriptor(&self) -> OutputDescriptor {
        OutputDescriptor {
            id: self.id,
            kind: OutputKind::EnttecUsbPro,
            label: self.label.clone(),
            universe: self.universe,
        }
    }
}
