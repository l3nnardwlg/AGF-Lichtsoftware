//! Tauri command surface.
//!
//! Each command is a thin shim: validate input, call into [`ShowEngine`],
//! return a serializable result.  Heavy lifting belongs in the engine.

use std::net::Ipv4Addr;
use std::str::FromStr;
use std::sync::Arc;

use tauri::State;
use uuid::Uuid;

use crate::dmx::artnet::ArtNetOutput;
use crate::dmx::enttec::{self, EnttecOpenDmxOutput, EnttecUsbProOutput, SerialPortInfo};
use crate::dmx::output::OutputDescriptor;
use crate::engine::{EngineSnapshot, ShowEngine};

type EngineRef<'a> = State<'a, Arc<ShowEngine>>;

/// Convert any error to a friendly String for the JS side.
fn err<E: std::fmt::Display>(e: E) -> String {
    format!("{e}")
}

#[tauri::command]
pub fn get_state_snapshot(engine: EngineRef<'_>) -> EngineSnapshot {
    engine.snapshot()
}

#[tauri::command]
pub fn set_channel(engine: EngineRef<'_>, universe: u16, address: u16, value: u8) {
    engine.set_channel(universe, address, value);
}

#[tauri::command]
pub fn set_grand_master(engine: EngineRef<'_>, value: u8) {
    engine.set_grand_master(value);
}

#[tauri::command]
pub fn blackout(engine: EngineRef<'_>, value: bool) {
    engine.set_blackout(value);
}

#[tauri::command]
pub fn list_outputs(engine: EngineRef<'_>) -> Vec<OutputDescriptor> {
    engine.list_outputs()
}

#[tauri::command]
pub fn remove_output(engine: EngineRef<'_>, id: String) -> Result<bool, String> {
    let uuid = Uuid::parse_str(&id).map_err(err)?;
    Ok(engine.remove_output(uuid))
}

#[tauri::command]
pub fn add_artnet_output(
    engine: EngineRef<'_>,
    ip: String,
    universe: u16,
    label: Option<String>,
) -> Result<OutputDescriptor, String> {
    let dest = Ipv4Addr::from_str(&ip).map_err(err)?;
    let label = label.unwrap_or_else(|| format!("Art-Net → {ip} (U{universe})"));
    let out = ArtNetOutput::new(dest, universe, label).map_err(err)?;
    Ok(engine.add_output(Box::new(out)))
}

#[tauri::command]
pub fn list_serial_ports() -> Vec<SerialPortInfo> {
    enttec::list_ports()
}

#[tauri::command]
pub fn add_enttec_open_dmx_output(
    engine: EngineRef<'_>,
    port: String,
    universe: u16,
    label: Option<String>,
) -> Result<OutputDescriptor, String> {
    let label = label.unwrap_or_else(|| format!("Open DMX {port} (U{universe})"));
    let out = EnttecOpenDmxOutput::open(&port, universe, label).map_err(err)?;
    Ok(engine.add_output(Box::new(out)))
}

#[tauri::command]
pub fn add_enttec_usb_pro_output(
    engine: EngineRef<'_>,
    port: String,
    universe: u16,
    label: Option<String>,
) -> Result<OutputDescriptor, String> {
    let label = label.unwrap_or_else(|| format!("DMX USB Pro {port} (U{universe})"));
    let out = EnttecUsbProOutput::open(&port, universe, label).map_err(err)?;
    Ok(engine.add_output(Box::new(out)))
}
