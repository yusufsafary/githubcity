import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, Suspense, useState, useCallback, memo } from 'react';
import * as THREE from 'three';

/* ═══════════════════════════════════════
   Building material palette
═══════════════════════════════════════ */
const MATS = {
  glass:    { body: '#9ab8cc', metal: 0.45, rough: 0.06, win: '#78d8f0', winB: '#50c0e0' },
  classic:  { body: '#ddd6c8', metal: 0.0,  rough: 0.78, win: '#4ABFB0', winB: '#3aa090' },
  concrete: { body: '#b8b4ae', metal: 0.04, rough: 0.92, win: '#4ABFB0', winB: '#3aa090' },
  warm:     { body: '#c8b890', metal: 0.0,  rough: 0.84, win: '#e8c060', winB: '#c8a040' },
  dark:     { body: '#707880', metal: 0.38, rough: 0.18, win: '#60d8f8', winB: '#40b8d8' },
} as const;
type MatKey = keyof typeof MATS;

/* ═══════════════════════════════════════
   Building data (type + features per building)
═══════════════════════════════════════ */
interface BldgDef {
  x: number; z: number; w: number; d: number; h: number;
  type: MatKey; crown?: boolean; antenna?: boolean; water?: boolean;
}

const BUILDINGS: BldgDef[] = [
  // ─── Center cluster ───
  { x: 0,    z: 0,    w: 1.05, d: 1.05, h: 5.0,  type: 'glass',    crown: true,  antenna: true },
  { x: -1.8, z: 0.5,  w: 0.92, d: 0.92, h: 3.4,  type: 'classic',  water: true },
  { x: 1.9,  z: -0.4, w: 0.98, d: 0.98, h: 4.0,  type: 'dark',     crown: true,  antenna: true },
  { x: 0.6,  z: -1.6, w: 0.88, d: 0.88, h: 2.9,  type: 'concrete' },
  { x: -1.2, z: -1.9, w: 0.82, d: 0.82, h: 2.5,  type: 'warm',     water: true },
  { x: 1.0,  z: 1.7,  w: 0.80, d: 0.80, h: 2.7,  type: 'classic' },
  // ─── Mid ring ───
  { x: -3.2, z: -0.4, w: 0.76, d: 0.76, h: 2.2,  type: 'warm' },
  { x: 3.1,  z: 0.9,  w: 0.80, d: 0.80, h: 2.6,  type: 'glass' },
  { x: 0.4,  z: 3.2,  w: 0.72, d: 0.72, h: 2.0,  type: 'concrete', water: true },
  { x: -2.2, z: 2.6,  w: 0.70, d: 0.70, h: 2.2,  type: 'classic' },
  { x: 2.6,  z: -2.1, w: 0.76, d: 0.76, h: 2.3,  type: 'dark' },
  { x: -2.6, z: -2.6, w: 0.70, d: 0.70, h: 1.8,  type: 'warm' },
  { x: 3.6,  z: -1.6, w: 0.66, d: 0.66, h: 1.5,  type: 'concrete' },
  { x: -3.0, z: 2.0,  w: 0.68, d: 0.68, h: 1.7,  type: 'glass' },
  // ─── Outer ring ───
  { x: -5.0, z: 1.5,  w: 0.60, d: 0.60, h: 1.3,  type: 'classic' },
  { x: 5.0,  z: 1.0,  w: 0.60, d: 0.60, h: 1.5,  type: 'warm' },
  { x: 1.2,  z: 5.0,  w: 0.56, d: 0.56, h: 1.0,  type: 'concrete' },
  { x: -1.8, z: -4.5, w: 0.60, d: 0.60, h: 1.1,  type: 'classic' },
  { x: 4.2,  z: -3.2, w: 0.56, d: 0.56, h: 1.0,  type: 'dark' },
  { x: -4.2, z: -3.5, w: 0.56, d: 0.56, h: 1.1,  type: 'warm' },
  { x: 2.5,  z: 4.5,  w: 0.56, d: 0.56, h: 0.9,  type: 'glass' },
  { x: -4.0, z: 4.0,  w: 0.56, d: 0.56, h: 1.2,  type: 'classic' },
  { x: 5.5,  z: -0.5, w: 0.50, d: 0.50, h: 0.8,  type: 'concrete' },
  { x: -5.5, z: -0.8, w: 0.50, d: 0.50, h: 0.9,  type: 'warm' },
];

/* ═══════════════════════════════════════
   Window grid face
═══════════════════════════════════════ */
const WinFaceBase = ({
  fw, fh, posZ, cols, rows, winA, winB, rotY = 0, nightMult = 1,
}: {
  fw: number; fh: number; posZ: number; cols: number; rows: number;
  winA: THREE.Color; winB: THREE.Color; rotY?: number; nightMult?: number;
}) => {
  const cSpc = fw / (cols + 1);
  const rSpc = fh / (rows + 1);
  const wW = cSpc * 0.48;
  const wH = Math.min(rSpc * 0.65, 0.3);
  return (
    <group rotation={[0, rotY, 0]}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const lit = (r + c) % 3 !== 0;
          const color = (r + c) % 4 === 0 ? winB : winA;
          return (
            <mesh key={`${r}-${c}`} position={[
              -fw / 2 + cSpc * (c + 1),
              -fh / 2 + rSpc * (r + 1),
              posZ,
            ]}>
              <planeGeometry args={[wW, wH]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={(lit ? 0.8 : 0.35) * nightMult}
                roughness={0.2}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
};
const WinFace = memo(WinFaceBase);

/* ═══════════════════════════════════════
   Water tower
═══════════════════════════════════════ */
function WaterTower({ ox, oy, oz }: { ox: number; oy: number; oz: number }) {
  return (
    <group position={[ox, oy, oz]}>
      {/* Tank */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.5, 10]} />
        <meshStandardMaterial color="#8a7a62" roughness={0.88} />
      </mesh>
      {/* Cone roof */}
      <mesh position={[0, 0.58, 0]}>
        <coneGeometry args={[0.18, 0.22, 10]} />
        <meshStandardMaterial color="#6a5c48" roughness={0.9} />
      </mesh>
      {/* 4 legs */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i}
            position={[Math.cos(a) * 0.1, 0.06, Math.sin(a) * 0.1]}
            rotation={[0, 0, Math.PI / 14]}
          >
            <cylinderGeometry args={[0.012, 0.012, 0.5, 4]} />
            <meshStandardMaterial color="#5a4c3a" roughness={0.92} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════
   AC unit cluster for rooftop
═══════════════════════════════════════ */
function AcUnits({ ox, oz, y }: { ox: number; oz: number; y: number }) {
  return (
    <>
      {[
        [ox, y, oz], [ox + 0.14, y, oz], [ox, y, oz + 0.14],
      ].map(([px, py, pz], i) => (
        <mesh key={i} position={[px as number, py as number, pz as number]}>
          <boxGeometry args={[0.1, 0.08, 0.1]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════
   Single building
═══════════════════════════════════════ */
const BuildingBase = ({
  x, z, w, d, h, type, crown, antenna, water, night,
}: BldgDef & { night: boolean }) => {
  const m = MATS[type];
  const nightMult = night ? 3.2 : 1.0;
  const winA = new THREE.Color(m.win);
  const winB = new THREE.Color(m.winB);

  const hasCrown = crown && h > 3.2;
  const baseH = hasCrown ? h * 0.64 : h;
  const crownH = hasCrown ? h * 0.36 : 0;
  const crownW = w * 0.70;
  const crownD = d * 0.70;

  const baseRows = Math.min(6, Math.max(2, Math.floor(baseH / 0.55)));
  const crownRows = Math.min(4, Math.max(1, Math.floor(crownH / 0.55)));
  const cols = w > 0.70 ? 2 : 1;

  return (
    <group position={[x, 0, z]}>
      {/* ── BASE ── */}
      <group position={[0, baseH / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, baseH, d]} />
          <meshStandardMaterial color={m.body} metalness={m.metal} roughness={m.rough} />
        </mesh>
        {/* Cornice (horizontal accent at top) */}
        <mesh position={[0, baseH / 2 + 0.04, 0]}>
          <boxGeometry args={[w + 0.05, 0.09, d + 0.05]} />
          <meshStandardMaterial color="#cccccc" roughness={0.65} metalness={0.1} />
        </mesh>
        {/* Front windows */}
        <WinFace fw={w} fh={baseH} posZ={d / 2 + 0.013}
          cols={cols} rows={baseRows} winA={winA} winB={winB} nightMult={nightMult} />
        {/* Right side windows */}
        <WinFace fw={d} fh={baseH} posZ={w / 2 + 0.013}
          cols={cols > 1 ? 1 : 1} rows={baseRows} winA={winA} winB={winB} rotY={Math.PI / 2} nightMult={nightMult * 0.75} />
      </group>

      {/* ── SETBACK CROWN ── */}
      {hasCrown && (
        <group position={[0, baseH + crownH / 2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[crownW, crownH, crownD]} />
            <meshStandardMaterial color={m.body} metalness={Math.min(1, m.metal + 0.1)} roughness={Math.max(0, m.rough - 0.06)} />
          </mesh>
          <mesh position={[0, crownH / 2 + 0.04, 0]}>
            <boxGeometry args={[crownW + 0.05, 0.08, crownD + 0.05]} />
            <meshStandardMaterial color="#bbbbbb" roughness={0.6} metalness={0.15} />
          </mesh>
          <WinFace fw={crownW} fh={crownH} posZ={crownD / 2 + 0.013}
            cols={1} rows={crownRows} winA={winA} winB={winB} nightMult={nightMult} />
          <WinFace fw={crownD} fh={crownH} posZ={crownW / 2 + 0.013}
            cols={1} rows={crownRows} winA={winA} winB={winB} rotY={Math.PI / 2} nightMult={nightMult * 0.75} />
        </group>
      )}

      {/* ── ANTENNA ── */}
      {antenna && h > 3.5 && (
        <group position={[0, h + 0.05, 0]}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.038, 1.1, 8]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.82} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0.60, 0]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial color={winA} emissive={winA} emissiveIntensity={night ? 2.8 : 0.9} />
          </mesh>
        </group>
      )}

      {/* ── WATER TOWER ── */}
      {water && (
        <WaterTower ox={w * 0.28} oy={baseH} oz={d * 0.28} />
      )}

      {/* ── AC UNITS ── */}
      {h > 1.5 && (
        <AcUnits ox={-w * 0.2} oz={-d * 0.2} y={baseH + 0.04} />
      )}
    </group>
  );
};
const Building = memo(BuildingBase);

/* ═══════════════════════════════════════
   Ground with roads + sidewalks
═══════════════════════════════════════ */
function Ground({ p }: { p: Palette }) {
  const roadPositions = [-6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6];
  return (
    <group>
      {/* Base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color={p.ground} roughness={0.96} />
      </mesh>
      {/* Road grid */}
      {roadPositions.map((v) => (
        <group key={v}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[v, 0.006, 0]}>
            <planeGeometry args={[0.08, 22]} />
            <meshBasicMaterial color={p.roadColor} opacity={p.roadOpacity} transparent />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, v]}>
            <planeGeometry args={[22, 0.08]} />
            <meshBasicMaterial color={p.roadColor} opacity={p.roadOpacity} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════
   Stars (night)
═══════════════════════════════════════ */
const STARS = Array.from({ length: 90 }, (_, i) => {
  const theta = (i / 90) * Math.PI * 2 + i * 0.41;
  const phi = Math.acos(1 - (i % 45) / 45) * 0.85;
  const r = 13 + (i % 5) * 1.2;
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.abs(Math.cos(phi)) + 3.5,
    r * Math.sin(phi) * Math.sin(theta),
  ] as [number, number, number];
});
function Stars({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      {STARS.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04 + (i % 4) * 0.014, 4, 4]} />
          <meshBasicMaterial color="#ffffff" opacity={0.35 + (i % 6) * 0.1} transparent />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════
   Camera — cinematic drift
═══════════════════════════════════════ */
function CameraDrift() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dy = Math.sin(t * 0.22) * 1.5;
    const dx = Math.cos(t * 0.14) * 0.9;
    const dz = Math.sin(t * 0.11) * 0.6;
    camera.position.set(10 + dx, 7 + dy, 10 + dz);
    camera.lookAt(0, 1.8, 0);
  });
  return null;
}

/* ═══════════════════════════════════════
   Rotating city group
═══════════════════════════════════════ */
function CityGroup({ p, night }: { p: Palette; night: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15;
  });
  return (
    <group ref={ref}>
      <Ground p={p} />
      <Stars visible={night} />
      {BUILDINGS.map((b, i) => (
        <Building key={i} {...b} night={night} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════
   Lights
═══════════════════════════════════════ */
type Palette = {
  sky: string; fog: string; fogNear: number; fogFar: number;
  ground: string; roadColor: string; roadOpacity: number;
  ambient: number; dirInt: number; dirColor: string;
  tealInt: number; streetInt: number;
};

const DAY: Palette = {
  sky: '#C45020', fog: '#C45020', fogNear: 13, fogFar: 32,
  ground: '#C1521E', roadColor: '#aa6040', roadOpacity: 0.5,
  ambient: 0.72, dirInt: 1.5, dirColor: '#fff8f0',
  tealInt: 0.6, streetInt: 0,
};
const NIGHT: Palette = {
  sky: '#0D0820', fog: '#0D0820', fogNear: 10, fogFar: 26,
  ground: '#130828', roadColor: '#1a0638', roadOpacity: 0.7,
  ambient: 0.10, dirInt: 0.20, dirColor: '#8899cc',
  tealInt: 2.4, streetInt: 1.0,
};

function Lights({ p }: { p: Palette }) {
  return (
    <>
      <ambientLight intensity={p.ambient} />
      <directionalLight position={[8, 14, 6]} intensity={p.dirInt} color={p.dirColor} castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5} shadow-camera-far={55}
        shadow-camera-left={-14} shadow-camera-right={14}
        shadow-camera-top={14} shadow-camera-bottom={-14}
      />
      <directionalLight position={[-6, 8, -4]} intensity={p.dirInt * 0.3} color={p.dirColor} />
      <pointLight position={[0, 10, 0]} intensity={p.tealInt} color="#4ABFB0" />
      {p.streetInt > 0 && (
        <>
          <pointLight position={[-3, 1.5, 3]} intensity={p.streetInt} color="#ffaa44" distance={8} />
          <pointLight position={[3, 1.5, -3]} intensity={p.streetInt} color="#ffaa44" distance={8} />
          <pointLight position={[-3, 1.5, -3]} intensity={p.streetInt * 0.65} color="#ff9933" distance={7} />
          <pointLight position={[3, 1.5, 3]} intensity={p.streetInt * 0.65} color="#ff9933" distance={7} />
          <pointLight position={[0, 2, 0]} intensity={p.streetInt * 0.4} color="#ffbb55" distance={6} />
        </>
      )}
    </>
  );
}

/* ═══════════════════════════════════════
   Toggle icons
═══════════════════════════════════════ */
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
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/* ═══════════════════════════════════════
   Main export
═══════════════════════════════════════ */
export default function HeroCity3D() {
  const [night, setNight] = useState(false);
  const p = night ? NIGHT : DAY;
  const toggle = useCallback(() => setNight(v => !v), []);

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
          <CameraDrift />
          <Lights p={p} />
          <CityGroup p={p} night={night} />
        </Suspense>
      </Canvas>

      {/* Night/Day toggle — bottom right */}
      <button
        onClick={toggle}
        title={night ? 'Switch to day' : 'Switch to night'}
        style={{
          position: 'absolute', bottom: '24px', right: '16px',
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '6px 12px', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.22)',
          background: night ? 'rgba(13,8,32,0.72)' : 'rgba(0,0,0,0.28)',
          color: night ? '#c8b8f0' : 'rgba(255,255,255,0.88)',
          fontSize: '12px', fontFamily: 'inherit', fontWeight: 500,
          cursor: 'pointer', backdropFilter: 'blur(8px)',
          transition: 'all 0.35s ease', zIndex: 10, letterSpacing: '0.01em',
        }}
      >
        {night ? <SunIcon /> : <MoonIcon />}
        {night ? 'Day' : 'Night'}
      </button>
    </div>
  );
}
