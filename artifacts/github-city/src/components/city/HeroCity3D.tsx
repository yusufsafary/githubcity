import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, Suspense, useState, useCallback } from 'react';
import * as THREE from 'three';

const BUILDINGS = [
  { x: 0,    z: 0,    w: 0.85, d: 0.85, h: 3.8 },
  { x: -1.4, z: 0.4,  w: 0.72, d: 0.72, h: 2.4 },
  { x: 1.5,  z: -0.3, w: 0.78, d: 0.78, h: 3.1 },
  { x: -2.4, z: -0.4, w: 0.62, d: 0.62, h: 1.5 },
  { x: 2.4,  z: 0.8,  w: 0.68, d: 0.68, h: 2.0 },
  { x: 0.4,  z: -1.9, w: 0.58, d: 0.58, h: 1.8 },
  { x: -1.0, z: -1.4, w: 0.64, d: 0.64, h: 2.1 },
  { x: 2.0,  z: -1.5, w: 0.58, d: 0.58, h: 1.3 },
  { x: -2.0, z: 1.4,  w: 0.58, d: 0.58, h: 1.6 },
  { x: 1.0,  z: 1.8,  w: 0.62, d: 0.62, h: 1.4 },
  { x: -3.0, z: 0.0,  w: 0.55, d: 0.55, h: 1.1 },
  { x: 3.0,  z: -0.5, w: 0.55, d: 0.55, h: 1.3 },
];

/* ---------- palette ---------- */
const DAY = {
  sky: '#C45020' as const,
  fog: '#C45020' as const,
  ground: '#C1521E' as const,
  roadOpacity: 0.5,
  buildingColor: '#f2ede8',
  winEmissive: '#4ABFB0',
  winIntensityA: 1.1,
  winIntensityB: 0.55,
  ambient: 0.65,
  dirIntensity: 1.3,
  dirColor: '#ffffff',
  tealIntensity: 0.6,
  streetIntensity: 0,
};

const NIGHT = {
  sky: '#0D0820' as const,
  fog: '#0D0820' as const,
  ground: '#130828' as const,
  roadOpacity: 0.25,
  buildingColor: '#d8d4e8',
  winEmissive: '#4ABFB0',
  winIntensityA: 3.2,
  winIntensityB: 2.0,
  ambient: 0.12,
  dirIntensity: 0.25,
  dirColor: '#8899cc',
  tealIntensity: 2.0,
  streetIntensity: 0.8,
};

/* ---------- Building ---------- */
function Building({
  x, z, w, d, h, p,
}: { x: number; z: number; w: number; d: number; h: number; p: typeof DAY }) {
  const winRows = Math.max(1, Math.floor(h / 0.75));
  const winColor = new THREE.Color(p.winEmissive);
  return (
    <group position={[x, h / 2, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={p.buildingColor} roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, h / 2 + 0.04, 0]}>
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial color={p.buildingColor} roughness={0.7} />
      </mesh>
      {/* Front windows */}
      {Array.from({ length: winRows }).map((_, i) => (
        <mesh key={i} position={[0, -h / 2 + 0.38 + i * 0.75, d / 2 + 0.015]}>
          <planeGeometry args={[w * 0.55, 0.18]} />
          <meshStandardMaterial
            color={winColor}
            emissive={winColor}
            emissiveIntensity={i % 3 === 1 ? p.winIntensityA : p.winIntensityB}
            roughness={0.3}
          />
        </mesh>
      ))}
      {/* Side windows */}
      {Array.from({ length: winRows }).map((_, i) => (
        <mesh key={`s${i}`} position={[w / 2 + 0.015, -h / 2 + 0.38 + i * 0.75, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[d * 0.45, 0.15]} />
          <meshStandardMaterial
            color={winColor}
            emissive={winColor}
            emissiveIntensity={i % 3 === 0 ? p.winIntensityA * 0.8 : p.winIntensityB * 0.7}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Ground ---------- */
function Ground({ p }: { p: typeof DAY }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color={p.ground} roughness={0.95} />
      </mesh>
      {[-3, -1.5, 0, 1.5, 3].map((v) => (
        <group key={v}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[v, 0.005, 0]}>
            <planeGeometry args={[0.05, 14]} />
            <meshBasicMaterial color="#aa6644" opacity={p.roadOpacity} transparent />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, v]}>
            <planeGeometry args={[14, 0.05]} />
            <meshBasicMaterial color="#aa6644" opacity={p.roadOpacity} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- Stars (night only) ---------- */
const STAR_POSITIONS = Array.from({ length: 60 }, (_, i) => {
  const theta = (i / 60) * Math.PI * 2;
  const phi = Math.acos(1 - (i % 30) / 30);
  const r = 9 + (i % 3) * 0.5;
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.abs(Math.cos(phi)) + 2,
    r * Math.sin(phi) * Math.sin(theta),
  ] as [number, number, number];
});

function Stars({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      {STAR_POSITIONS.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04 + (i % 3) * 0.015, 4, 4]} />
          <meshBasicMaterial color="#ffffff" opacity={0.5 + (i % 5) * 0.1} transparent />
        </mesh>
      ))}
    </>
  );
}

/* ---------- City rotating group ---------- */
function CityGroup({ p, nightMode }: { p: typeof DAY; nightMode: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.22;
  });

  return (
    <group ref={groupRef}>
      <Ground p={p} />
      <Stars visible={nightMode} />
      {BUILDINGS.map((b, i) => (
        <Building key={i} {...b} p={p} />
      ))}
    </group>
  );
}

/* ---------- Scene lights ---------- */
function Lights({ p }: { p: typeof DAY }) {
  return (
    <>
      <ambientLight intensity={p.ambient} />
      <directionalLight
        position={[6, 9, 4]}
        intensity={p.dirIntensity}
        color={p.dirColor}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <pointLight position={[0, 7, 0]} intensity={p.tealIntensity} color="#4ABFB0" />
      {p.streetIntensity > 0 && (
        <>
          <pointLight position={[-2, 1.5, 2]} intensity={p.streetIntensity} color="#ffaa44" distance={5} />
          <pointLight position={[2, 1.5, -2]} intensity={p.streetIntensity} color="#ffaa44" distance={5} />
          <pointLight position={[0, 1.5, 0]} intensity={p.streetIntensity * 0.5} color="#ff8833" distance={4} />
        </>
      )}
    </>
  );
}

/* ---------- Toggle button (SVG icons, no dependency) ---------- */
function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/* ---------- Main export ---------- */
export default function HeroCity3D() {
  const [nightMode, setNightMode] = useState(false);
  const p = nightMode ? NIGHT : DAY;

  const toggle = useCallback(() => setNightMode(v => !v), []);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '296px',
        height: '164px',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)',
        background: p.sky,
        position: 'relative',
        transition: 'background 0.6s ease',
      }}
    >
      <Canvas
        camera={{ position: [5.5, 4.5, 5.5], fov: 48 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <color attach="background" args={[p.sky]} />
        <fog attach="fog" args={[p.fog, 9, 20]} />
        <Suspense fallback={null}>
          <Lights p={p} />
          <CityGroup p={p} nightMode={nightMode} />
        </Suspense>
      </Canvas>

      {/* Day/Night toggle button */}
      <button
        onClick={toggle}
        title={nightMode ? 'Switch to day' : 'Switch to night'}
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 10px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: nightMode ? 'rgba(13,8,32,0.7)' : 'rgba(0,0,0,0.25)',
          color: nightMode ? '#c8b8f0' : 'rgba(255,255,255,0.85)',
          fontSize: '11px',
          fontFamily: 'inherit',
          fontWeight: 500,
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
          transition: 'all 0.3s ease',
          zIndex: 10,
          letterSpacing: '0.01em',
        }}
      >
        {nightMode ? <SunIcon /> : <MoonIcon />}
        {nightMode ? 'Day' : 'Night'}
      </button>
    </div>
  );
}
