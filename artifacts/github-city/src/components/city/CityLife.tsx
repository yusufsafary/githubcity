import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Street Lamp ─────────────────────────────────────────── */
function StreetLamp({ x, z, nightMode }: { x: number; z: number; nightMode: boolean }) {
  const glowInt = nightMode ? 3.8 : 0.18;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.038, 0.058, 2.5, 6]} />
        <meshStandardMaterial color="#787878" metalness={0.62} roughness={0.38} />
      </mesh>
      <mesh position={[0.27, 2.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 0.54, 5]} />
        <meshStandardMaterial color="#787878" metalness={0.62} roughness={0.38} />
      </mesh>
      <mesh position={[0.54, 2.48, 0]}>
        <boxGeometry args={[0.19, 0.10, 0.12]} />
        <meshStandardMaterial color="#444" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.54, 2.43, 0]}>
        <boxGeometry args={[0.13, 0.03, 0.085]} />
        <meshStandardMaterial color="#ffe8aa" emissive="#ffcc44" emissiveIntensity={glowInt} />
      </mesh>
      {nightMode && (
        <pointLight position={[0.54, 2.4, 0]} color="#ffcc66" intensity={2.2} distance={7} decay={2} />
      )}
    </group>
  );
}

/* ── Park Bench ──────────────────────────────────────────── */
function Bench({ x, z, rotY = 0 }: { x: number; z: number; rotY?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.90, 0.065, 0.32]} />
        <meshStandardMaterial color="#7a5530" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.65, -0.13]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.90, 0.20, 0.055]} />
        <meshStandardMaterial color="#7a5530" roughness={0.9} />
      </mesh>
      {([-0.34, 0.34] as number[]).flatMap(lx =>
        ([-0.12, 0.12] as number[]).map((lz, j) => (
          <mesh key={`${lx}-${j}`} position={[lx, 0.19, lz]}>
            <boxGeometry args={[0.055, 0.38, 0.045]} />
            <meshStandardMaterial color="#555" metalness={0.4} roughness={0.6} />
          </mesh>
        ))
      )}
    </group>
  );
}

/* ── Bus Stop ────────────────────────────────────────────── */
function BusStop({ x, z, rotY = 0, nightMode }: { x: number; z: number; rotY?: number; nightMode: boolean }) {
  const glassOp = 0.45;
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 2.32, 0]}>
        <boxGeometry args={[1.5, 0.085, 0.65]} />
        <meshStandardMaterial color="#1a5276" metalness={0.3} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.16, -0.28]}>
        <boxGeometry args={[1.5, 2.32, 0.045]} />
        <meshStandardMaterial color="#aaddff" transparent opacity={glassOp} metalness={0.2} roughness={0.15} />
      </mesh>
      {([-0.69, 0.69] as number[]).map((px, i) => (
        <mesh key={i} position={[px, 1.16, 0]}>
          <boxGeometry args={[0.065, 2.32, 0.065]} />
          <meshStandardMaterial color="#1a5276" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0.69, 2.62, 0]}>
        <boxGeometry args={[0.28, 0.20, 0.045]} />
        <meshStandardMaterial color="#f39c12" emissive="#f39c12" emissiveIntensity={nightMode ? 1.2 : 0.4} />
      </mesh>
      <mesh position={[-0.69, 0.55, -0.25]}>
        <boxGeometry args={[0.12, 0.045, 0.02]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={nightMode ? 0.8 : 0.1} />
      </mesh>
    </group>
  );
}

/* ── Animated Fountain ───────────────────────────────────── */
function Fountain({ nightMode }: { nightMode: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const WATER = nightMode ? '#80d8ff' : '#4ABFB0';
  const N = 20;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const phase = (i / N) * Math.PI * 2;
      const speed = 0.9 + (i % 5) * 0.18;
      const age = ((t * speed + phase * 0.5) % Math.PI);
      const arc = Math.sin(age);
      const r = arc * 0.55;
      mesh.position.set(Math.cos(phase) * r, arc * 1.1 + 0.88, Math.sin(phase) * r);
      mesh.scale.setScalar(0.6 + arc * 0.5);
      (mesh.material as THREE.MeshBasicMaterial).opacity = arc * 0.85;
    });
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.3, 1.45, 0.30, 18]} />
        <meshStandardMaterial color="#c4a87a" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.29, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 18]} />
        <meshStandardMaterial color={WATER} transparent opacity={0.65} metalness={0.15} roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.15 + 0.58, 0]}>
        <cylinderGeometry args={[0.095, 0.13, 0.58, 8]} />
        <meshStandardMaterial color="#c4a87a" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.15 + 1.0, 0]}>
        <cylinderGeometry args={[0.40, 0.28, 0.105, 12]} />
        <meshStandardMaterial color="#c4a87a" roughness={0.88} />
      </mesh>
      <group ref={groupRef}>
        {Array.from({ length: N }, (_, i) => (
          <mesh key={i} position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.055, 4, 4]} />
            <meshBasicMaterial color={WATER} transparent opacity={0.7} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {nightMode && (
        <pointLight position={[0, 0.6, 0]} color="#4ABFB0" intensity={2.5} distance={6} decay={2} />
      )}
    </group>
  );
}

/* ── Trash Can ───────────────────────────────────────────── */
function TrashCan({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.12, 0.10, 0.64, 8]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.06, 8]} />
        <meshStandardMaterial color="#333" roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
  );
}

/* ── Placement data ──────────────────────────────────────── */
const toXZ = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [Math.cos(a) * r, Math.sin(a) * r];
};

const LAMP_RING1 = [0, 45, 90, 135, 180, 225, 270, 315].map(d => toXZ(7, d));
const LAMP_RING2 = [30, 90, 150, 210, 270, 330].map(d => toXZ(13, d));
const LAMP_RING3 = [15, 75, 135, 195, 255, 315].map(d => toXZ(19, d));

const BENCH_DEFS: Array<{ x: number; z: number; rot: number }> = [
  { x:  3.5, z:  1.5, rot: 0.8 },
  { x: -3.2, z:  2.0, rot: 2.4 },
  { x:  2.0, z: -3.5, rot: 4.8 },
  { x: -2.8, z: -2.8, rot: 1.2 },
  { x:  5.5, z:  3.0, rot: 3.3 },
  { x: -5.0, z: -3.5, rot: 0.5 },
  { x:  1.0, z:  6.0, rot: 2.0 },
  { x: -6.0, z:  1.0, rot: 5.1 },
  { x:  6.5, z: -2.5, rot: 1.8 },
  { x: -1.5, z: -6.0, rot: 3.8 },
];

const BUSSTOP_DEFS: Array<{ x: number; z: number; rot: number }> = [
  { x:  11.0, z:   0.0, rot: Math.PI / 2 },
  { x: -11.0, z:   0.0, rot: -Math.PI / 2 },
  { x:   0.0, z:  11.0, rot: 0 },
  { x:   0.0, z: -11.0, rot: Math.PI },
];

const TRASH_DEFS: Array<[number, number]> = [
  [4, 4], [-4, 4], [4, -4], [-4, -4],
  [8, 2], [-8, 2], [2, 8], [-2, -8],
];

/* ── CityLife export ─────────────────────────────────────── */
export default function CityLife({ nightMode }: { nightMode: boolean }) {
  return (
    <>
      <Fountain nightMode={nightMode} />

      {LAMP_RING1.map(([x, z], i) => (
        <StreetLamp key={`l1-${i}`} x={x} z={z} nightMode={nightMode} />
      ))}
      {LAMP_RING2.map(([x, z], i) => (
        <StreetLamp key={`l2-${i}`} x={x} z={z} nightMode={nightMode} />
      ))}
      {LAMP_RING3.map(([x, z], i) => (
        <StreetLamp key={`l3-${i}`} x={x} z={z} nightMode={nightMode} />
      ))}

      {BENCH_DEFS.map((b, i) => (
        <Bench key={`b-${i}`} x={b.x} z={b.z} rotY={b.rot} />
      ))}

      {BUSSTOP_DEFS.map((s, i) => (
        <BusStop key={`bs-${i}`} x={s.x} z={s.z} rotY={s.rot} nightMode={nightMode} />
      ))}

      {TRASH_DEFS.map(([x, z], i) => (
        <TrashCan key={`tc-${i}`} x={x} z={z} />
      ))}
    </>
  );
}
