import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { usePatchStore } from "../../../stores/patchStore";

/** Hardware-accelerated 2.5D stage visualizer using Three.js.
 *
 *  - Fixtures appear as small icons on a flat stage plane.
 *  - When a dimmer / RGB value is present, a semi-transparent light cone
 *    is rendered from the fixture position towards the floor.
 *  - For Phase A we render placeholder fixtures from the patch store with
 *    a constant intensity so the visual is non-empty.  Wiring to live DMX
 *    values comes in Phase B/C.
 */
export function StageVisualizer() {
  const fixtures = usePatchStore((s) => s.fixtures);
  const selectedIds = usePatchStore((s) => s.selectedIds);
  const select = usePatchStore((s) => s.selectFixture);

  return (
    <div className="flex-1 panel-flat overflow-hidden relative">
      <div className="panel-header justify-between">
        <span>Stage Visualizer</span>
        <span className="text-text-dim/40 text-[10px]">
          {fixtures.length} fixtures · WebGL
        </span>
      </div>

      <div className="absolute inset-0 top-9">
        <Canvas
          camera={{ position: [0, 6, 8], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          shadows
        >
          <color attach="background" args={["#0d0d0d"]} />
          <Suspense fallback={null}>
            <Stage />
            {fixtures.map((f) => (
              <FixtureCone
                key={f.id}
                position={[
                  (f.x - 0.5) * 10,
                  4,
                  (f.y - 0.5) * 6,
                ]}
                color="#ffd28a"
                intensity={0.6}
                selected={selectedIds.includes(f.id)}
                onClick={(additive) => select(f.id, additive)}
              />
            ))}
            <ambientLight intensity={0.06} />
            <OrbitControls
              enablePan
              enableRotate
              maxPolarAngle={Math.PI / 2.1}
              minDistance={3}
              maxDistance={30}
            />
          </Suspense>
        </Canvas>

        {fixtures.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted">
              <div className="text-sm">No fixtures patched yet</div>
              <div className="text-[11px] mt-1 text-muted-2">
                Open <span className="text-text-dim">Setup</span> to drag fixtures onto the universe grid
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stage() {
  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      {/* Grid */}
      <gridHelper args={[20, 20, "#2a2a2a", "#1f1f1f"]} position={[0, 0.01, 0]} />
      {/* Back wall */}
      <mesh position={[0, 3, -6]} receiveShadow>
        <planeGeometry args={[20, 6]} />
        <meshStandardMaterial color="#151515" roughness={1} />
      </mesh>
    </>
  );
}

interface ConeProps {
  position: [number, number, number];
  color: string;
  intensity: number;
  selected: boolean;
  onClick: (additive: boolean) => void;
}

function FixtureCone({ position, color, intensity, selected, onClick }: ConeProps) {
  const coneGeom = useMemo(() => new THREE.ConeGeometry(1.4, 4, 32, 1, true), []);

  return (
    <group position={position}>
      {/* Fixture body */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick(e.shiftKey ?? false);
        }}
      >
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={selected ? "#007aff" : "#444"} emissive={selected ? "#0a84ff" : "#000"} emissiveIntensity={selected ? 0.6 : 0} />
      </mesh>

      {/* Light cone (volumetric look) */}
      <mesh geometry={coneGeom} position={[0, -2, 0]} renderOrder={1}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12 * intensity}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Spot light for actual scene illumination */}
      <spotLight
        position={[0, 0, 0]}
        target-position={[0, -4, 0]}
        angle={Math.PI / 7}
        penumbra={0.4}
        intensity={intensity * 4}
        color={color}
        castShadow
        distance={10}
      />
    </group>
  );
}
