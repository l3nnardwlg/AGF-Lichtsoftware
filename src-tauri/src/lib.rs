//! AGF Light – Rust core entry.
//!
//! Bootstraps Tauri, initializes the show engine, and exposes IPC commands
//! to the React frontend.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod dmx;
mod engine;
mod ipc;

use std::sync::Arc;

use tracing_subscriber::EnvFilter;

use crate::engine::ShowEngine;

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,agf_light_lib=debug"));
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .compact()
        .init();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();
    tracing::info!("Starting AGF Light backend");

    let engine = Arc::new(ShowEngine::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(engine.clone())
        .setup(move |app| {
            // Spawn the 44 Hz DMX output loop on a dedicated OS thread.
            engine.clone().spawn_output_loop(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ipc::commands::get_state_snapshot,
            ipc::commands::set_channel,
            ipc::commands::set_grand_master,
            ipc::commands::add_artnet_output,
            ipc::commands::list_serial_ports,
            ipc::commands::add_enttec_open_dmx_output,
            ipc::commands::add_enttec_usb_pro_output,
            ipc::commands::remove_output,
            ipc::commands::list_outputs,
            ipc::commands::blackout,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AGF Light");
}
