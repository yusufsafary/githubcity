import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, Suspense, useState, useCallback } from 'react';
import * as THREE from 'three';

/* ---------- City layout — spread out for fullscreen ---------- */
const BUILDINGS = [
  // Center cluster (tall)
  { x: 0,    z: 0,    w: 1.05, d: 1.05, h: 5.0 },
  { x: -1.8, z: 0.5,  w: 0.92, d: 0.92, h: 3.4 },
  { x: 1.9,  z: -0.4, w: 0.98, d: 0.98, h: 4.0 },
  { x: 0.6,  z: -1.6, w: 0.88, d: 0.88, h: 2.9 },
  { x: -1.2, z: -1.9, w: 0.82, d: 0.82, h: 2.5 },
  { x: 1.0,  z: 1.7,  w: 0.80, d: 0.80, h: 2.7 },
  // Mid ring
  { x: -3.2, z: -0.4, w: 0.75, d: 0.75, h: 2.1 },
  { x: 3.1,  z: 0.9,  w: 0.80, d: 0.80, h: 2.6 },
  { x: 0.4,  z: 3.2,  w: 0.72, d: 0.72, h: 1.9 },
  { x: -2.2, z: 2.6,  w: 0.70, d: 0.70, h: 2.2 },
  { x: 2.6,  z: -2.1, w: 0.76, d: 0.76, h: 2.3 },
  { x: -2.6, z: -2.6, w: 0.70, d: 0.70, h: 1.7 },
  { x: 3.6,  z: -1.6, w: 0.66, d: 0.66, h: 1.5 },
  { x: -3.0, z: 2.0,  w: 0.68, d: 0.68, h: 1.6 },
  // Outer ring
  { x: -5.0, z: 1.5,  w: 0.60, d: 0.60, h: 1.2 },
  { x: 5.0,  z: 1.0,  w: 0.60, d: 0.60, h: 1.4 },
  { x: 1.2,  z: 5.0,  w: 0.56, d: 0.56, h: 1.0 },
  { x: -1.8, z: -4.5, w: 0.60, d: 0.60, h: 1.1 },
  { x: 4.2,  z: -3.2, w: 0.56, d: 0.56, h: 0.9 },
  { x: -4.2, z: -3.5, w: 0.56, d: 0.56, h: 1.1 },
  { x: 2.5,  z: 4.5,  w: 0.56, d: 0.56, h: 0.9 },
  { x: -4.0, z: 4.0,  w: 0.56, d: 0.56, h: 1.2 },
  { x: 5.5,  z: -0.5, w: 0.50, d: 0.50, h: 0.8 },
  { x: -5.5, z: -0.8, w: 0.50, d: 0.50, h: 0.9 },
];

/* ---------- Palettes ---------- */
const DAY = {
  sky: '#C45020',
  fog: '#C45020',
  fogNear: 12, fogFar: 30,
  ground: '#C1521E',
  roadColor: '#aa6644',
  roadOpacity: 0.45,
  building: '#f2ede8',
  winColor: '#4ABFB0',
  winHigh: 1.0, winLow: 0.5,
  ambient: 0.70,
  dirInt: 1.4, dirColor: '#ffffff',
  tealInt: 0.7,
  streetInt: 0,
};
const NIGHT = {
  sky: '#0D0820',
  fog: '#0D0820',
  fogNear: 10, fogFar: 26,
  ground: '#130828',
  roadColor: '#220840',
  roadOpacity: 0.6,
  building: '#d8d4e8',
  winColor: '#4ABFB0',
  winHigh: 3.5, winLow: 2.0,
  ambient: 0.10,
  dirInt: 0.22, dirColor: '#8899cc',
  tealInt: 2.2,
  streetInt: 0.9,
};

type Palette = typeof DAY;

/* ---------- Building ---------- */
function Building({ x, z, w, d, h, p }: { x: number; z: number; w: number; d: number; h: number; p: Palette }) {
  const rows = Math.max(1, Math.floor(h / 0.75));
  const wc = new THREE.Color(p.winColor);
  return (
    <group position={[x, h / 2, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={p.building} roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, h / 2 + 0.05, 0]}>
        <boxGeometry args={[w, 0.1, d]} />
        <meshStandardMaterial color={p.building} roughness={0.7} />
      </mesh>
      {/* Antenna on tallest center tower */}
      {h > 4.5 && (
        <>
          <mesh position={[0, h / 2 + 0.4, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
            <meshStandardMaterial color="#cccccc" roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[0, h / 2 + 0.82, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={wc} emissive={wc} emissiveIntensity={p.winHigh} />
          </mesh>
        </>
      )}
      {/* Front windows */}
      {Array.from({ length: rows }).map((_, i) => (
        <mesh key={i} position={[0, -h / 2 + 0.38 + i * 0.75, d / 2 + 0.016]}>
          <planeGeometry args={[w * 0.55, 0.18]} />
          <meshStandardMaterial color={wc} emissive={wc} emissiveIntensity={i % 3 === 1 ? p.winHigh : p.winLow} roughness={0.3} />
        </mesh>
      ))}
      {/* Side windows */}
      {Array.from({ length: rows }).map((_, i) => (
        <mesh key={`s${i}`} position={[w / 2 + 0.016, -h / 2 + 0.38 + i * 0.75, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[d * 0.45, 0.15]} />
          <meshStandardMaterial color={wc} emissive={wc} emissiveIntensity={i % 3 === 0 ? p.winHigh * 0.8 : p.winLow * 0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Ground ---------- */
function Ground({ p }: { p: Palette }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color={p.ground} roughness={0.95} />
      </mesh>
      {[-6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6].map((v) => (
        <group key={v}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[v, 0.005, 0]}>
            <planeGeometry args={[0.06, 22]} />
            <meshBasicMaterial color={p.roadColor} opacity={p.roadOpacity} transparent />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, v]}>
            <planeGeometry args={[22, 0.06]} />
            <meshBasicMaterial color={p.roadColor} opacity={p.roadOpacity} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- Stars ---------- */
const STARS = Array.from({ length: 80 }, (_, i) => {
  const theta = (i / 80) * Math.PI * 2 + i * 0.37;
  const phi = Math.acos(1 - (i % 40) / 40) * 0.8;
  const r = 12 + (i % 4) * 1.5;
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.abs(Math.cos(phi)) + 3,
    r * Math.sin(phi) * Math.sin(theta),
  ] as [number, number, number];
});

function Stars({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      {STARS.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.05 + (i % 4) * 0.01, 4, 4]} />
          <meshBasicMaterial color="#ffffff" opacity={0.4 + (i % 5) * 0.1} transparent />
        </mesh>
      ))}
    </>
  );
}

/* ---------- Rotating city ---------- */
function CityGroup({ p, night }: { p: Palette; night: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.18;
  });
  return (
    <group ref={ref}>
      <Ground p={p} />
      <Stars visible={night} />
      {BUILDINGS.map((b, i) => <Building key={i} {...b} p={p} />)}
    </group>
  );
}

/* ---------- Lights ---------- */
function Lights({ p }: { p: Palette }) {
  return (
    <>
      <ambientLight intensity={p.ambient} />
      <directionalLight position={[8, 12, 6]} intensity={p.dirInt} color={p.dirColor} castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-near={0.5} shadow-camera-far={50}
        shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
      <pointLight position={[0, 10, 0]} intensity={p.tealInt} color="#4ABFB0" />
      {p.streetInt > 0 && (
        <>
          <pointLight position={[-3, 1.8, 3]} intensity={p.streetInt} color="#ffaa44" distance={7} />
          <pointLight position={[3, 1.8, -3]} intensity={p.streetInt} color="#ffaa44" distance={7} />
          <pointLight position={[-3, 1.8, -3]} intensity={p.streetInt * 0.6} color="#ff8833" distance={6} />
          <pointLight position={[3, 1.8, 3]} intensity={p.streetInt * 0.6} color="#ff8833" distance={6} />
        </>
      )}
    </>
  );
}

/* ---------- Icons ---------- */
function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/* ---------- Export ---------- */
interface HeroCity3DProps {
  onToggleNight?: (night: boolean) => void;
}

export default function HeroCity3D({ onToggleNight }: HeroCity3DProps) {
  const [night, setNight] = useState(false);
  const p = night ? NIGHT : DAY;

  const toggle = useCallback(() => {
    setNight(v => {
      const next = !v;
      onToggleNight?.(next);
      return next;
    });
  }, [onToggleNight]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [10, 7, 10], fov: 52 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={[p.sky]} />
        <fog attach="fog" args={[p.fog, p.fogNear, p.fogFar]} />
        <Suspense fallback={null}>
          <Lights p={p} />
          <CityGroup p={p} night={night} />
        </Suspense>
      </Canvas>

      {/* Day/Night toggle — bottom right */}
      <button
        onClick={toggle}
        title={night ? 'Switch to day' : 'Switch to night'}
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: night ? 'rgba(13,8,32,0.72)' : 'rgba(0,0,0,0.28)',
          color: night ? '#c8b8f0' : 'rgba(255,255,255,0.88)',
          fontSize: '12px',
          fontFamily: 'inherit',
          fontWeight: 500,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.35s ease',
          zIndex: 10,
          letterSpacing: '0.01em',
        }}
      >
        {night ? <SunIcon /> : <MoonIcon />}
        {night ? 'Day' : 'Night'}
      </button>
    </div>
  );
}
