//! Art-Net v4 (UDP, port 6454) output.
//!
//! Implements the minimal **ArtDMX** packet needed to drive most fixtures
//! and nodes.  Sequence numbers are incremented per frame so receivers can
//! drop out-of-order packets (Art-Net spec §6.3).
//!
//! The full spec is here: <https://art-net.org.uk/>

use std::net::{Ipv4Addr, SocketAddr, UdpSocket};

use anyhow::Context;
use uuid::Uuid;

use super::output::{DmxOutput, OutputDescriptor, OutputId, OutputKind};
use super::universe::UniverseId;

const ARTNET_PORT: u16 = 6454;
const OPCODE_OUTPUT_DMX: u16 = 0x5000;
const PROTOCOL_VERSION: u16 = 14;
const ARTNET_HEADER: &[u8; 8] = b"Art-Net\0";

/// Encodes a (net, subnet, universe) tuple into the 15-bit Art-Net address.
#[derive(Debug, Clone, Copy)]
pub struct ArtNetAddress {
    pub net: u8,     // 0..=127 (7 bits)
    pub subnet: u8,  // 0..=15  (4 bits)
    pub universe: u8 // 0..=15  (4 bits)
}

impl ArtNetAddress {
    /// Map a flat universe index 0..=32767 to (net, subnet, universe).
    pub fn from_flat(index: u16) -> Self {
        Self {
            net: ((index >> 8) & 0x7F) as u8,
            subnet: ((index >> 4) & 0x0F) as u8,
            universe: (index & 0x0F) as u8,
        }
    }
}

pub struct ArtNetOutput {
    id: OutputId,
    label: String,
    universe: UniverseId,
    target: SocketAddr,
    socket: UdpSocket,
    sequence: u8,
    packet: [u8; 18 + 512],
}

impl ArtNetOutput {
    /// Bind a UDP socket and target `dest` (typically the node's IP, or
    /// `255.255.255.255` for broadcast).  Use `0.0.0.0:0` on the bind side
    /// so the OS picks an ephemeral port.
    pub fn new(dest: Ipv4Addr, universe: UniverseId, label: impl Into<String>) -> anyhow::Result<Self> {
        let socket = UdpSocket::bind(SocketAddr::from((Ipv4Addr::UNSPECIFIED, 0)))
            .context("bind Art-Net UDP socket")?;
        socket.set_broadcast(true).ok();
        socket.set_nonblocking(true).ok();

        let target = SocketAddr::from((dest, ARTNET_PORT));

        // Pre-fill the static parts of the ArtDMX packet (header + opcode +
        // version + dummy length).  Slot 12/13 = sequence/physical, 14/15 =
        // sub/net (low/high), 16/17 = length (big endian).
        let mut packet = [0u8; 18 + 512];
        packet[0..8].copy_from_slice(ARTNET_HEADER);
        packet[8..10].copy_from_slice(&OPCODE_OUTPUT_DMX.to_le_bytes());
        packet[10..12].copy_from_slice(&PROTOCOL_VERSION.to_be_bytes());
        packet[16..18].copy_from_slice(&(512u16).to_be_bytes());

        Ok(Self {
            id: Uuid::new_v4(),
            label: label.into(),
            universe,
            target,
            socket,
            sequence: 0,
            packet,
        })
    }
}

impl DmxOutput for ArtNetOutput {
    fn universe(&self) -> UniverseId {
        self.universe
    }

    fn write_universe(&mut self, data: &[u8; 512]) -> anyhow::Result<()> {
        // Sequence rolls 1..=255 (0 = disabled per spec).
        self.sequence = self.sequence.wrapping_add(1);
        if self.sequence == 0 {
            self.sequence = 1;
        }

        let addr = ArtNetAddress::from_flat(self.universe);
        self.packet[12] = self.sequence;
        self.packet[13] = 0; // physical input – informational only
        self.packet[14] = (addr.subnet << 4) | addr.universe;
        self.packet[15] = addr.net;
        self.packet[18..18 + 512].copy_from_slice(data);

        match self.socket.send_to(&self.packet, self.target) {
            Ok(_) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => Ok(()),
            Err(e) => Err(e.into()),
        }
    }

    fn descriptor(&self) -> OutputDescriptor {
        OutputDescriptor {
            id: self.id,
            kind: OutputKind::ArtNet,
            label: self.label.clone(),
            universe: self.universe,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn artnet_address_mapping() {
        let a = ArtNetAddress::from_flat(0);
        assert_eq!((a.net, a.subnet, a.universe), (0, 0, 0));
        let b = ArtNetAddress::from_flat(0xFFF);
        assert_eq!((b.net, b.subnet, b.universe), (0, 0x0F, 0x0F));
        let c = ArtNetAddress::from_flat(0x1234);
        assert_eq!((c.net, c.subnet, c.universe), (0x12, 0x03, 0x04));
    }
}
