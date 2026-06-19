import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Car ─────────────────────────────────────────────────── */
interface MoverProps { radius: number; speed: number; startAngle: number; color: string }

function Car({ radius, speed, startAngle, color }: MoverProps) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() / 1000;
    const angle = startAngle + t * speed;
    ref.current.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    ref.current.rotation.y = Math.PI / 2 - angle;
  });

  const wheels: [number, number, number][] = [
    [-0.24, 0.068, 0.19], [-0.24, 0.068, -0.19],
    [ 0.24, 0.068, 0.19], [ 0.24, 0.068, -0.19],
  ];

  return (
    <group ref={ref}>
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.70, 0.15, 0.38]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[0.04, 0.25, 0]}>
        <boxGeometry args={[0.35, 0.13, 0.31]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0.04, 0.25, 0]}>
        <boxGeometry args={[0.36, 0.11, 0.32]} />
        <meshStandardMaterial color="#a8ddf0" transparent opacity={0.38} metalness={0.9} roughness={0.04} />
      </mesh>
      {wheels.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.066, 0.066, 0.06, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0.36, 0.15,  0.11]}>
        <boxGeometry args={[0.02, 0.055, 0.07]} />
        <meshStandardMaterial color="#fffde8" emissive="#ffe099" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0.36, 0.15, -0.11]}>
        <boxGeometry args={[0.02, 0.055, 0.07]} />
        <meshStandardMaterial color="#fffde8" emissive="#ffe099" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[-0.36, 0.15,  0.11]}>
        <boxGeometry args={[0.02, 0.04, 0.055]} />
        <meshStandardMaterial color="#ff1a1a" emissive="#ff1a1a" emissiveIntensity={1.3} />
      </mesh>
      <mesh position={[-0.36, 0.15, -0.11]}>
        <boxGeometry args={[0.02, 0.04, 0.055]} />
        <meshStandardMaterial color="#ff1a1a" emissive="#ff1a1a" emissiveIntensity={1.3} />
      </mesh>
    </group>
  );
}

/* ── Pedestrian ──────────────────────────────────────────── */
const SHIRT_COLORS = ['#e05c2a','#3178c6','#b07219','#4ABFB0','#e74c3c','#9b59b6','#2ecc71','#e67e22','#1abc9c'];
const SKIN_TONES  = ['#f4c09a','#d4956a','#8d5524','#e8b89a','#c68642'];

interface PedProps { radius: number; speed: number; startAngle: number; idx: number }

function Pedestrian({ radius, speed, startAngle, idx }: PedProps) {
  const ref = useRef<THREE.Group>(null);
  const shirt = SHIRT_COLORS[idx % SHIRT_COLORS.length];
  const skin  = SKIN_TONES[idx % SKIN_TONES.length];

  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() / 1000;
    const angle = startAngle + t * speed;
    const bob = Math.abs(Math.sin(t * Math.abs(speed) * 15)) * 0.016;
    ref.current.position.set(Math.cos(angle) * radius, bob, Math.sin(angle) * radius);
    ref.current.rotation.y = Math.PI / 2 - angle;
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.215, 0]}>
        <sphereGeometry args={[0.048, 8, 8]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.248, 0]}>
        <sphereGeometry args={[0.037, 7, 7]} />
        <meshStandardMaterial color="#2c1a0e" roughness={1} />
      </mesh>
      <mesh position={[0, 0.135, 0]}>
        <boxGeometry args={[0.066, 0.10, 0.050]} />
        <meshStandardMaterial color={shirt} roughness={0.85} />
      </mesh>
      <mesh position={[0.018, 0.068, 0]}>
        <boxGeometry args={[0.028, 0.06, 0.040]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      <mesh position={[-0.018, 0.068, 0]}>
        <boxGeometry args={[0.028, 0.06, 0.040]} />
        <meshStandardMaterial color="#1a1a40" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ── Traffic scene ───────────────────────────────────────── */
const CARS: MoverProps[] = [
  { radius: 12.5, speed:  0.28, startAngle: 0.00, color: '#c0392b' },
  { radius: 12.5, speed:  0.28, startAngle: 3.14, color: '#2471a3' },
  { radius: 16.0, speed: -0.20, startAngle: 1.05, color: '#d4ac0d' },
  { radius: 16.0, speed: -0.20, startAngle: 4.20, color: '#1e8449' },
  { radius:  9.5, speed:  0.34, startAngle: 2.10, color: '#7d3c98' },
  { radius:  9.5, speed:  0.34, startAngle: 5.00, color: '#17a589' },
  { radius: 20.0, speed:  0.16, startAngle: 0.80, color: '#e74c3c' },
  { radius: 20.0, speed:  0.16, startAngle: 3.90, color: '#2e86c1' },
  { radius: 13.5, speed: -0.24, startAngle: 1.60, color: '#ca6f1e' },
];

const PEDS: Array<{ radius: number; speed: number; startAngle: number }> = [
  { radius: 5.0, speed:  0.18, startAngle: 0.00 },
  { radius: 5.0, speed:  0.18, startAngle: 2.10 },
  { radius: 5.0, speed:  0.18, startAngle: 4.20 },
  { radius: 7.5, speed: -0.13, startAngle: 1.00 },
  { radius: 7.5, speed: -0.13, startAngle: 3.50 },
  { radius: 7.5, speed: -0.13, startAngle: 5.80 },
  { radius: 3.5, speed:  0.26, startAngle: 0.50 },
  { radius: 3.5, speed:  0.26, startAngle: 3.64 },
  { radius:10.5, speed:  0.11, startAngle: 0.00 },
  { radius:10.5, speed:  0.11, startAngle: 3.14 },
  { radius: 6.0, speed: -0.20, startAngle: 0.70 },
  { radius: 6.0, speed: -0.20, startAngle: 4.00 },
];

export default function Traffic() {
  return (
    <>
      {CARS.map((c, i) => <Car key={`car-${i}`} {...c} />)}
      {PEDS.map((p, i) => <Pedestrian key={`ped-${i}`} {...p} idx={i} />)}
    </>
  );
}
