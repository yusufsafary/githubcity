import {
  Canvas, useFrame, useThree,
} from '@react-three/fiber';
import {
  createContext, useContext, useRef, useMemo,
  Suspense, useState, useCallback, memo,
} from 'react';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════
   Shared transition progress  (0 = day, 1 = night)
   Updated every frame via lerp — no React re-render
═══════════════════════════════════════════════ */
const ProgressCtx = createContext<React.MutableRefObject<number>>({ current: 0 });

function TransitionDriver({ night }: { night: boolean }) {
  const pr = useContext(ProgressCtx);
  useFrame((_, dt) => {
    pr.current = THREE.MathUtils.lerp(pr.current, night ? 1 : 0, dt * 1.6);
  });
  return null;
}

/* ═══════════════════════════════════════════════
   Palette constants
═══════════════════════════════════════════════ */
const DAY_SKY = new THREE.Color('#C45020');
const NIGHT_SKY = new THREE.Color('#0C0718');
const DAY_FOG = new THREE.Color('#C45020');
const NIGHT_FOG = new THREE.Color('#0C0718');
const DAY_DIR = new THREE.Color('#fff8f0');
const NIGHT_DIR = new THREE.Color('#8899cc');

/* ═══════════════════════════════════════════════
   Dynamic sky + fog  (direct scene manipulation)
═══════════════════════════════════════════════ */
function DynamicSky() {
  const { scene } = useThree();
  const pr = useContext(ProgressCtx);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const t = pr.current;
    col.lerpColors(DAY_SKY, NIGHT_SKY, t);
    (scene.background as THREE.Color)?.set(col);
    const fog = scene.fog as THREE.Fog | null;
    if (fog) fog.color.lerpColors(DAY_FOG, NIGHT_FOG, t);
  });
  return null;
}

/* ═══════════════════════════════════════════════
   Dynamic lights
═══════════════════════════════════════════════ */
function DynamicLights() {
  const pr = useContext(ProgressCtx);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const dir2Ref = useRef<THREE.DirectionalLight>(null);
  const tealRef = useRef<THREE.PointLight>(null);
  const s1 = useRef<THREE.PointLight>(null);
  const s2 = useRef<THREE.PointLight>(null);
  const s3 = useRef<THREE.PointLight>(null);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const t = pr.current;
    if (ambRef.current) ambRef.current.intensity = THREE.MathUtils.lerp(0.72, 0.10, t);
    if (dirRef.current) {
      dirRef.current.intensity = THREE.MathUtils.lerp(1.5, 0.18, t);
      col.lerpColors(DAY_DIR, NIGHT_DIR, t);
      dirRef.current.color.set(col);
    }
    if (dir2Ref.current) dir2Ref.current.intensity = THREE.MathUtils.lerp(0.45, 0.08, t);
    if (tealRef.current) tealRef.current.intensity = THREE.MathUtils.lerp(0.5, 2.8, t);
    const street = THREE.MathUtils.lerp(0, 1.1, t);
    if (s1.current) s1.current.intensity = street;
    if (s2.current) s2.current.intensity = street;
    if (s3.current) s3.current.intensity = street * 0.6;
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.72} />
      <directionalLight ref={dirRef} position={[8, 14, 6]} intensity={1.5}
        castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5} shadow-camera-far={55}
        shadow-camera-left={-14} shadow-camera-right={14}
        shadow-camera-top={14} shadow-camera-bottom={-14} />
      <directionalLight ref={dir2Ref} position={[-6, 8, -4]} intensity={0.45} />
      <pointLight ref={tealRef} position={[0, 10, 0]} color="#4ABFB0" intensity={0.5} />
      <pointLight ref={s1} position={[-3, 1.5, 3]} color="#ffaa44" distance={9} intensity={0} />
      <pointLight ref={s2} position={[3, 1.5, -3]} color="#ffaa44" distance={9} intensity={0} />
      <pointLight ref={s3} position={[0, 1.5, 0]} color="#ff9933" distance={7} intensity={0} />
    </>
  );
}

/* ═══════════════════════════════════════════════
   Aurora bands  (night only)
═══════════════════════════════════════════════ */
const AURORA_DEFS = [
  { color: '#22ffaa', h: 7.5, sz: 22, sp: 0.28, phase: 0 },
  { color: '#aa40ff', h: 9.0, sz: 20, sp: 0.19, phase: 2.1 },
  { color: '#40e0d0', h: 10.5, sz: 18, sp: 0.35, phase: 4.5 },
];

function Aurora() {
  const pr = useContext(ProgressCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const a = AURORA_DEFS[i];
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = p * 0.13 * (0.6 + Math.sin(t * a.sp + a.phase) * 0.4);
      mesh.position.y = a.h + Math.sin(t * 0.22 + a.phase) * 0.6;
      mesh.rotation.y = t * 0.018 * (i % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <>
      {AURORA_DEFS.map((a, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}
          rotation={[Math.PI / 2, 0, i * 0.7]} position={[0, a.h, 0]}>
          <planeGeometry args={[a.sz, a.sz, 1, 1]} />
          <meshBasicMaterial color={a.color} opacity={0} transparent
            side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Searchlight beams  (night only, 2 rotating cones)
═══════════════════════════════════════════════ */
function SearchBeams() {
  const pr = useContext(ProgressCtx);
  const b1 = useRef<THREE.Group>(null);
  const b2 = useRef<THREE.Group>(null);
  const m1 = useRef<THREE.MeshBasicMaterial>(null);
  const m2 = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    const op = p * 0.10;

    if (b1.current) {
      b1.current.rotation.z = Math.sin(t * 0.45) * 0.38 - 0.15;
      b1.current.rotation.x = Math.cos(t * 0.28) * 0.2;
    }
    if (b2.current) {
      b2.current.rotation.z = -Math.sin(t * 0.38 + 1.4) * 0.35 + 0.12;
      b2.current.rotation.x = Math.cos(t * 0.32 + 0.7) * 0.22;
    }
    if (m1.current) m1.current.opacity = op;
    if (m2.current) m2.current.opacity = op * 0.85;
  });

  return (
    <>
      {/* Beam 1 — from left cluster building */}
      <group position={[-1.8, 3.4, 0.5]}>
        <group ref={b1}>
          <mesh>
            <coneGeometry args={[0.6, 14, 16, 1, true]} />
            <meshBasicMaterial ref={m1} color="#ffffff" opacity={0} transparent
              side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      </group>
      {/* Beam 2 — from right tall building */}
      <group position={[1.9, 4.0, -0.4]}>
        <group ref={b2}>
          <mesh>
            <coneGeometry args={[0.5, 12, 16, 1, true]} />
            <meshBasicMaterial ref={m2} color="#c0d8ff" opacity={0} transparent
              side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      </group>
    </>
  );
}

/* ═══════════════════════════════════════════════
   Floating particles
═══════════════════════════════════════════════ */
interface ParticleDef { x: number; z: number; y: number; speed: number; size: number; col: string }

function Particles() {
  const pr = useContext(ProgressCtx);
  const defs = useMemo<ParticleDef[]>(() => {
    const rng = (seed: number) => {
      const x = Math.sin(seed) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 90 }, (_, i) => ({
      x: (rng(i * 3.1) - 0.5) * 14,
      z: (rng(i * 7.3) - 0.5) * 14,
      y: rng(i * 2.7) * 9,
      speed: 0.25 + rng(i * 5.1) * 0.5,
      size: 0.028 + rng(i * 1.9) * 0.038,
      col: i % 4 === 0 ? '#f0a050' : i % 4 === 1 ? '#4ABFB0' : i % 3 === 0 ? '#ffffff' : '#70d8ff',
    }));
  }, []);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((_, dt) => {
    const p = pr.current;
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.y += dt * defs[i].speed;
      if (mesh.position.y > 11) mesh.position.y = 0;
    });
    matRefs.current.forEach((mat, i) => {
      if (!mat) return;
      const isNight = i % 4 < 2; // teal/blue particles more visible at night
      mat.opacity = isNight
        ? THREE.MathUtils.lerp(0.05, 0.55, p)
        : THREE.MathUtils.lerp(0.15, 0.08, p);
    });
  });

  return (
    <>
      {defs.map((d, i) => (
        <mesh key={i}
          ref={el => { meshRefs.current[i] = el; }}
          position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[d.size, 4, 4]} />
          <meshBasicMaterial ref={el => { matRefs.current[i] = el; }}
            color={d.col} opacity={0.12} transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Day clouds  (simple puffs drifting across)
═══════════════════════════════════════════════ */
const CLOUDS = Array.from({ length: 5 }, (_, i) => ({
  x: (i - 2) * 5.5,
  y: 7 + i * 0.4,
  z: -8 + i * 1.2,
  sx: 3.5 + i * 0.6,
  sz: 1.8 + i * 0.3,
}));

function DayClouds() {
  const pr = useContext(ProgressCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame((_, dt) => {
    const p = pr.current;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.x += dt * (0.18 + i * 0.04);
      if (mesh.position.x > 16) mesh.position.x = -16;
    });
    matRefs.current.forEach(mat => {
      if (!mat) return;
      mat.opacity = THREE.MathUtils.lerp(0.55, 0, p);
    });
  });

  return (
    <>
      {CLOUDS.map((c, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}
          position={[c.x, c.y, c.z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[c.sx, c.sz]} />
          <meshStandardMaterial ref={el => { matRefs.current[i] = el; }}
            color="#ffffff" opacity={0.55} transparent
            side={THREE.DoubleSide} roughness={1} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Horizon glow ring
═══════════════════════════════════════════════ */
function HorizonGlow() {
  const pr = useContext(ProgressCtx);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 0.5 + Math.sin(t * 0.7) * 0.08;
    matRef.current.opacity = THREE.MathUtils.lerp(0.10, 0.22, pr.current) * pulse;
    matRef.current.color.lerpColors(new THREE.Color('#ff8840'), new THREE.Color('#4040ff'), pr.current);
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
      <ringGeometry args={[2, 8, 64]} />
      <meshBasicMaterial ref={matRef} color="#ff8840" opacity={0.1}
        transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   Sun / Moon orb in sky
═══════════════════════════════════════════════ */
function SkyOrb() {
  const pr = useContext(ProgressCtx);
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const haloRef = useRef<THREE.MeshBasicMaterial>(null);

  const SUN = new THREE.Color('#fff4d0');
  const MOON = new THREE.Color('#d0e8ff');

  useFrame(({ clock }) => {
    const t = pr.current;
    const a = clock.getElapsedTime() * 0.05;
    if (meshRef.current) {
      meshRef.current.position.set(
        Math.cos(a + Math.PI * t) * 10,
        6 + Math.sin(a) * 0.5 + (1 - t) * 2,
        Math.sin(a + Math.PI * t) * 6 - 10,
      );
    }
    if (matRef.current) {
      matRef.current.color.lerpColors(SUN, MOON, t);
    }
    if (haloRef.current) {
      haloRef.current.color.lerpColors(
        new THREE.Color('#ffee88'), new THREE.Color('#8899ff'), t
      );
      haloRef.current.opacity = THREE.MathUtils.lerp(0.18, 0.25, t);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[10, 8, -10]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshBasicMaterial ref={matRef} color="#fff4d0" />
      </mesh>
      {/* Halo */}
      <mesh ref={meshRef} position={[10, 8, -10]}>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshBasicMaterial ref={haloRef} color="#ffee88" opacity={0.18}
          transparent side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Camera — cinematic drift
═══════════════════════════════════════════════ */
function CameraDrift() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    camera.position.set(
      10 + Math.cos(t * 0.14) * 1.1,
      7 + Math.sin(t * 0.22) * 1.8,
      10 + Math.sin(t * 0.11) * 0.8,
    );
    camera.lookAt(0, 1.8, 0);
  });
  return null;
}

/* ═══════════════════════════════════════════════
   Stars
═══════════════════════════════════════════════ */
const STARS = Array.from({ length: 100 }, (_, i) => {
  const rng = (s: number) => { const x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };
  const theta = rng(i * 2.3) * Math.PI * 2;
  const phi = Math.acos(1 - rng(i * 3.7) * 0.9) * 0.9;
  const r = 13 + rng(i * 1.7) * 4;
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.abs(Math.cos(phi)) + 4, r * Math.sin(phi) * Math.sin(theta)] as [number, number, number];
});

function Stars() {
  const pr = useContext(ProgressCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const p = pr.current;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        THREE.MathUtils.lerp(0, 0.6, Math.max(0, (p - 0.4) / 0.6)) * (0.4 + (i % 6) * 0.1);
    });
  });

  return (
    <>
      {STARS.map((pos, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={pos}>
          <sphereGeometry args={[0.04 + (i % 4) * 0.014, 4, 4]} />
          <meshBasicMaterial color="#ffffff" opacity={0} transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Building system
═══════════════════════════════════════════════ */
const MATS = {
  glass:    { body: '#C4A87C', metal: 0.28, rough: 0.38, win: '#4ABFB0', winB: '#2CA89A' },
  classic:  { body: '#B89468', metal: 0.0,  rough: 0.86, win: '#4ABFB0', winB: '#2CA89A' },
  concrete: { body: '#A08262', metal: 0.02, rough: 0.92, win: '#4ABFB0', winB: '#2CA89A' },
  warm:     { body: '#C09060', metal: 0.0,  rough: 0.84, win: '#e8c060', winB: '#c8a040' },
  dark:     { body: '#8A7260', metal: 0.22, rough: 0.48, win: '#4ABFB0', winB: '#2CA89A' },
} as const;
type MatKey = keyof typeof MATS;

interface BldgDef {
  x: number; z: number; w: number; d: number; h: number;
  type: MatKey; crown?: boolean; antenna?: boolean; water?: boolean;
}

const BUILDINGS: BldgDef[] = [
  { x: 0,    z: 0,    w: 1.05, d: 1.05, h: 5.0,  type: 'glass',    crown: true,  antenna: true },
  { x: -1.8, z: 0.5,  w: 0.92, d: 0.92, h: 3.4,  type: 'classic',  water: true },
  { x: 1.9,  z: -0.4, w: 0.98, d: 0.98, h: 4.0,  type: 'dark',     crown: true,  antenna: true },
  { x: 0.6,  z: -1.6, w: 0.88, d: 0.88, h: 2.9,  type: 'concrete' },
  { x: -1.2, z: -1.9, w: 0.82, d: 0.82, h: 2.5,  type: 'warm',     water: true },
  { x: 1.0,  z: 1.7,  w: 0.80, d: 0.80, h: 2.7,  type: 'classic' },
  { x: -3.2, z: -0.4, w: 0.76, d: 0.76, h: 2.2,  type: 'warm' },
  { x: 3.1,  z: 0.9,  w: 0.80, d: 0.80, h: 2.6,  type: 'glass' },
  { x: 0.4,  z: 3.2,  w: 0.72, d: 0.72, h: 2.0,  type: 'concrete', water: true },
  { x: -2.2, z: 2.6,  w: 0.70, d: 0.70, h: 2.2,  type: 'classic' },
  { x: 2.6,  z: -2.1, w: 0.76, d: 0.76, h: 2.3,  type: 'dark' },
  { x: -2.6, z: -2.6, w: 0.70, d: 0.70, h: 1.8,  type: 'warm' },
  { x: 3.6,  z: -1.6, w: 0.66, d: 0.66, h: 1.5,  type: 'concrete' },
  { x: -3.0, z: 2.0,  w: 0.68, d: 0.68, h: 1.7,  type: 'glass' },
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

const WinFaceBase = ({ fw, fh, posZ, cols, rows, winA, winB, rotY = 0, nightMult = 1 }: {
  fw: number; fh: number; posZ: number; cols: number; rows: number;
  winA: THREE.Color; winB: THREE.Color; rotY?: number; nightMult?: number;
}) => {
  const cSpc = fw / (cols + 1);
  const rSpc = fh / (rows + 1);
  const wW = cSpc * 0.48; const wH = Math.min(rSpc * 0.65, 0.3);
  return (
    <group rotation={[0, rotY, 0]}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const lit = (r + c) % 3 !== 0;
          const color = (r + c) % 4 === 0 ? winB : winA;
          return (
            <mesh key={`${r}-${c}`} position={[-fw/2 + cSpc*(c+1), -fh/2 + rSpc*(r+1), posZ]}>
              <planeGeometry args={[wW, wH]} />
              <meshStandardMaterial color={color} emissive={color}
                emissiveIntensity={(lit ? 0.85 : 0.38) * nightMult} roughness={0.2} />
            </mesh>
          );
        })
      )}
    </group>
  );
};
const WinFace = memo(WinFaceBase);

function WaterTower({ ox, oy, oz }: { ox: number; oy: number; oz: number }) {
  return (
    <group position={[ox, oy, oz]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.5, 10]} />
        <meshStandardMaterial color="#8a7a62" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <coneGeometry args={[0.18, 0.22, 10]} />
        <meshStandardMaterial color="#6a5c48" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.1, 0.06, Math.sin(a) * 0.1]} rotation={[0, 0, Math.PI / 14]}>
            <cylinderGeometry args={[0.012, 0.012, 0.5, 4]} />
            <meshStandardMaterial color="#5a4c3a" roughness={0.92} />
          </mesh>
        );
      })}
    </group>
  );
}

const BuildingBase = ({ x, z, w, d, h, type, crown, antenna, water, night }: BldgDef & { night: boolean }) => {
  const m = MATS[type];
  const nightMult = night ? 3.0 : 1.0;
  const winA = useMemo(() => new THREE.Color(m.win), [m.win]);
  const winB = useMemo(() => new THREE.Color(m.winB), [m.winB]);
  const hasCrown = crown && h > 3.2;
  const baseH = hasCrown ? h * 0.64 : h;
  const crownH = hasCrown ? h * 0.36 : 0;
  const crownW = w * 0.70; const crownD = d * 0.70;
  const baseRows = Math.min(6, Math.max(2, Math.floor(baseH / 0.55)));
  const crownRows = Math.min(4, Math.max(1, Math.floor(crownH / 0.55)));
  const cols = w > 0.70 ? 2 : 1;

  return (
    <group position={[x, 0, z]}>
      <group position={[0, baseH / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, baseH, d]} />
          <meshStandardMaterial color={m.body} metalness={m.metal} roughness={m.rough} />
        </mesh>
        <mesh position={[0, baseH / 2 + 0.04, 0]}>
          <boxGeometry args={[w + 0.05, 0.09, d + 0.05]} />
          <meshStandardMaterial color="#cccccc" roughness={0.65} metalness={0.1} />
        </mesh>
        <WinFace fw={w} fh={baseH} posZ={d/2+0.013} cols={cols} rows={baseRows} winA={winA} winB={winB} nightMult={nightMult} />
        <WinFace fw={d} fh={baseH} posZ={w/2+0.013} cols={1} rows={baseRows} winA={winA} winB={winB} rotY={Math.PI/2} nightMult={nightMult*0.7} />
      </group>
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
          <WinFace fw={crownW} fh={crownH} posZ={crownD/2+0.013} cols={1} rows={crownRows} winA={winA} winB={winB} nightMult={nightMult} />
          <WinFace fw={crownD} fh={crownH} posZ={crownW/2+0.013} cols={1} rows={crownRows} winA={winA} winB={winB} rotY={Math.PI/2} nightMult={nightMult*0.7} />
        </group>
      )}
      {antenna && h > 3.5 && (
        <group position={[0, h + 0.05, 0]}>
          <mesh><cylinderGeometry args={[0.022, 0.038, 1.1, 8]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.82} roughness={0.18} /></mesh>
          <mesh position={[0, 0.60, 0]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial color={winA} emissive={winA} emissiveIntensity={night ? 2.8 : 0.9} />
          </mesh>
        </group>
      )}
      {water && <WaterTower ox={w * 0.28} oy={baseH} oz={d * 0.28} />}
    </group>
  );
};
const Building = memo(BuildingBase);

function Ground({ night }: { night: boolean }) {
  const pr = useContext(ProgressCtx);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const D = new THREE.Color('#C1521E');
  const N = new THREE.Color('#130828');
  const roadD = new THREE.Color('#aa6040');
  const roadN = new THREE.Color('#1a0638');

  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.color.lerpColors(D, N, pr.current);
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial ref={matRef} color={night ? '#130828' : '#C1521E'} roughness={0.96} />
      </mesh>
      {[-6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6].map((v) => (
        <group key={v}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[v, 0.006, 0]}>
            <planeGeometry args={[0.07, 24]} />
            <meshBasicMaterial color={night ? '#1a0638' : '#aa6040'} opacity={0.55} transparent />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, v]}>
            <planeGeometry args={[24, 0.07]} />
            <meshBasicMaterial color={night ? '#1a0638' : '#aa6040'} opacity={0.55} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Mini Traffic — scaled for hero city (~0.3× main)
═══════════════════════════════════════════════ */
const MINI_CARS = [
  { radius: 3.2, speed:  0.30, startAngle: 0.0,  color: '#c0392b' },
  { radius: 3.2, speed:  0.30, startAngle: 3.14, color: '#2471a3' },
  { radius: 4.5, speed: -0.22, startAngle: 1.05, color: '#d4ac0d' },
  { radius: 4.5, speed: -0.22, startAngle: 4.20, color: '#1e8449' },
  { radius: 2.2, speed:  0.38, startAngle: 2.10, color: '#8e44ad' },
  { radius: 2.2, speed:  0.38, startAngle: 5.00, color: '#17a589' },
];

const MINI_PED_SHIRTS = ['#e05c2a','#3178c6','#4ABFB0','#e74c3c','#9b59b6','#2ecc71','#f39c12','#1abc9c'];
const MINI_PED_SKIN   = ['#f4c09a','#d4956a','#8d5524','#e8b89a'];

const MINI_PEDS = [
  { radius: 1.5, speed:  0.20, startAngle: 0.0 },
  { radius: 1.5, speed:  0.20, startAngle: 2.1 },
  { radius: 1.5, speed:  0.20, startAngle: 4.2 },
  { radius: 2.0, speed: -0.16, startAngle: 1.0 },
  { radius: 2.0, speed: -0.16, startAngle: 3.5 },
  { radius: 2.8, speed:  0.12, startAngle: 0.5 },
  { radius: 2.8, speed:  0.12, startAngle: 3.6 },
];

function MiniCar({ radius, speed, startAngle, color }: { radius: number; speed: number; startAngle: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() / 1000;
    const angle = startAngle + t * speed;
    ref.current.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    ref.current.rotation.y = Math.PI / 2 - angle;
  });
  const wheels: [number, number, number][] = [
    [-0.08, 0.022, 0.063], [-0.08, 0.022, -0.063],
    [ 0.08, 0.022, 0.063], [ 0.08, 0.022, -0.063],
  ];
  return (
    <group ref={ref}>
      <mesh position={[0, 0.043, 0]}>
        <boxGeometry args={[0.23, 0.05, 0.126]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.012, 0.083, 0]}>
        <boxGeometry args={[0.115, 0.043, 0.100]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </mesh>
      {wheels.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.020, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[ 0.12, 0.048,  0.037]}>
        <boxGeometry args={[0.007, 0.018, 0.024]} />
        <meshStandardMaterial color="#fffde8" emissive="#ffe099" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[ 0.12, 0.048, -0.037]}>
        <boxGeometry args={[0.007, 0.018, 0.024]} />
        <meshStandardMaterial color="#fffde8" emissive="#ffe099" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-0.12, 0.048,  0.037]}>
        <boxGeometry args={[0.007, 0.014, 0.020]} />
        <meshStandardMaterial color="#ff1a1a" emissive="#ff1a1a" emissiveIntensity={1.3} />
      </mesh>
      <mesh position={[-0.12, 0.048, -0.037]}>
        <boxGeometry args={[0.007, 0.014, 0.020]} />
        <meshStandardMaterial color="#ff1a1a" emissive="#ff1a1a" emissiveIntensity={1.3} />
      </mesh>
    </group>
  );
}

function MiniPed({ radius, speed, startAngle, idx }: { radius: number; speed: number; startAngle: number; idx: number }) {
  const ref = useRef<THREE.Group>(null);
  const shirt = MINI_PED_SHIRTS[idx % MINI_PED_SHIRTS.length];
  const skin  = MINI_PED_SKIN[idx % MINI_PED_SKIN.length];
  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() / 1000;
    const angle = startAngle + t * speed;
    const bob = Math.abs(Math.sin(t * Math.abs(speed) * 15)) * 0.006;
    ref.current.position.set(Math.cos(angle) * radius, bob, Math.sin(angle) * radius);
    ref.current.rotation.y = Math.PI / 2 - angle;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.072, 0]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.044, 0]}>
        <boxGeometry args={[0.022, 0.034, 0.016]} />
        <meshStandardMaterial color={shirt} roughness={0.85} />
      </mesh>
      <mesh position={[0.006, 0.022, 0]}>
        <boxGeometry args={[0.009, 0.020, 0.013]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      <mesh position={[-0.006, 0.022, 0]}>
        <boxGeometry args={[0.009, 0.020, 0.013]} />
        <meshStandardMaterial color="#1a1a40" roughness={0.9} />
      </mesh>
    </group>
  );
}

function HeroTraffic() {
  return (
    <>
      {MINI_CARS.map((c, i) => <MiniCar key={`mc-${i}`} {...c} />)}
      {MINI_PEDS.map((p, i) => <MiniPed key={`mp-${i}`} {...p} idx={i} />)}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Mini Trees (3 types: pine, round, palm)
═══════════════════════════════════════════════ */
const HERO_TREE_DEFS: Array<{ x: number; z: number; s: number; t: 0|1|2 }> = [
  { x:  2.6, z:  1.6, s: 0.38, t: 0 },
  { x: -2.1, z:  2.1, s: 0.30, t: 1 },
  { x:  1.6, z: -2.6, s: 0.34, t: 0 },
  { x: -3.0, z: -1.1, s: 0.32, t: 2 },
  { x:  0.5, z:  3.6, s: 0.27, t: 1 },
  { x: -1.6, z: -3.2, s: 0.29, t: 0 },
  { x:  3.6, z: -2.0, s: 0.24, t: 2 },
  { x: -3.6, z:  2.6, s: 0.28, t: 1 },
  { x:  4.6, z:  0.6, s: 0.21, t: 0 },
  { x: -4.6, z: -0.6, s: 0.23, t: 1 },
  { x:  2.1, z:  4.1, s: 0.20, t: 2 },
  { x: -2.6, z: -4.1, s: 0.22, t: 0 },
  { x:  5.2, z: -1.5, s: 0.18, t: 1 },
  { x: -5.2, z:  1.5, s: 0.19, t: 2 },
];

function MiniTree({ x, z, s, t }: { x: number; z: number; s: number; t: 0|1|2 }) {
  const trunk = '#5c3d1e';
  const green = t === 0 ? '#2d6a4f' : t === 1 ? '#3a7a55' : '#4a8a3a';
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.22 * s, 0]}>
        <cylinderGeometry args={[0.05 * s, 0.07 * s, 0.44 * s, 5]} />
        <meshStandardMaterial color={trunk} roughness={0.92} />
      </mesh>
      {t === 0 && (
        <>
          <mesh position={[0, 0.60 * s, 0]}>
            <coneGeometry args={[0.52 * s, 0.95 * s, 7]} />
            <meshStandardMaterial color={green} roughness={0.82} />
          </mesh>
          <mesh position={[0, 1.18 * s, 0]}>
            <coneGeometry args={[0.32 * s, 0.72 * s, 7]} />
            <meshStandardMaterial color={green} roughness={0.82} />
          </mesh>
        </>
      )}
      {t === 1 && (
        <mesh position={[0, 1.1 * s, 0]}>
          <sphereGeometry args={[0.52 * s, 8, 7]} />
          <meshStandardMaterial color={green} roughness={0.84} />
        </mesh>
      )}
      {t === 2 && (
        <mesh position={[0, 1.2 * s, 0]}>
          <coneGeometry args={[0.68 * s, 0.45 * s, 6]} />
          <meshStandardMaterial color={green} roughness={0.80} />
        </mesh>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Mini Street Lamps
═══════════════════════════════════════════════ */
const HERO_LAMP_DEFS: Array<[number, number]> = [
  [ 2.2,  2.2], [-2.2,  2.2], [ 2.2, -2.2], [-2.2, -2.2],
  [ 3.8,  0.0], [-3.8,  0.0], [ 0.0,  3.8], [ 0.0, -3.8],
  [ 5.0,  2.0], [-5.0, -2.0],
];

function MiniLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.012, 0.018, 0.84, 5]} />
        <meshStandardMaterial color="#888" metalness={0.62} roughness={0.38} />
      </mesh>
      <mesh position={[0.09, 0.82, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.007, 0.007, 0.18, 5]} />
        <meshStandardMaterial color="#888" metalness={0.62} roughness={0.38} />
      </mesh>
      <mesh position={[0.18, 0.82, 0]}>
        <boxGeometry args={[0.060, 0.030, 0.038]} />
        <meshStandardMaterial color="#ffe8aa" emissive="#ffcc44" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Mini Benches
═══════════════════════════════════════════════ */
const HERO_BENCH_DEFS: Array<{ x: number; z: number; r: number }> = [
  { x:  1.4, z:  1.4, r: 0.8 },
  { x: -1.4, z:  1.4, r: 2.4 },
  { x:  1.4, z: -1.4, r: 4.8 },
  { x: -1.4, z: -1.4, r: 1.2 },
];

function MiniBench({ x, z, r }: { x: number; z: number; r: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.28, 0.022, 0.10]} />
        <meshStandardMaterial color="#7a5530" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.21, -0.04]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.28, 0.064, 0.018]} />
        <meshStandardMaterial color="#7a5530" roughness={0.9} />
      </mesh>
      {([-0.11, 0.11] as number[]).map((lx, i) => (
        <mesh key={i} position={[lx, 0.06, 0]}>
          <boxGeometry args={[0.018, 0.12, 0.015]} />
          <meshStandardMaterial color="#555" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function CityGroup({ night }: { night: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.14; });
  return (
    <group ref={ref}>
      <Ground night={night} />
      {BUILDINGS.map((b, i) => <Building key={i} {...b} night={night} />)}
      <HeroTraffic />
      {HERO_TREE_DEFS.map((t, i) => <MiniTree key={`t-${i}`} {...t} />)}
      {HERO_LAMP_DEFS.map(([x, z], i) => <MiniLamp key={`l-${i}`} x={x} z={z} />)}
      {HERO_BENCH_DEFS.map((b, i) => <MiniBench key={`bh-${i}`} x={b.x} z={b.z} r={b.r} />)}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Icons
═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   Main export
═══════════════════════════════════════════════ */
export default function HeroCity3D() {
  const [night, setNight] = useState(false);
  const progressRef = useRef(0);
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
        <color attach="background" args={['#C45020']} />
        <fog attach="fog" args={['#C45020', 13, 32]} />

        <ProgressCtx.Provider value={progressRef}>
          <Suspense fallback={null}>
            <TransitionDriver night={night} />
            <DynamicSky />
            <DynamicLights />
            <CameraDrift />
            <CityGroup night={night} />
            <Stars />
            <Particles />
            <Aurora />
            <SearchBeams />
            <DayClouds />
            <SkyOrb />
            <HorizonGlow />
          </Suspense>
        </ProgressCtx.Provider>
      </Canvas>

      {/* Night/Day toggle */}
      <button
        onClick={toggle}
        style={{
          position: 'absolute', bottom: '24px', right: '16px',
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '6px 12px', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.22)',
          background: night ? 'rgba(13,8,32,0.75)' : 'rgba(0,0,0,0.28)',
          color: night ? '#c8b8f0' : 'rgba(255,255,255,0.9)',
          fontSize: '12px', fontFamily: 'inherit', fontWeight: 500,
          cursor: 'pointer', backdropFilter: 'blur(8px)',
          transition: 'all 0.4s ease', zIndex: 10, letterSpacing: '0.01em',
        }}
      >
        {night ? <SunIcon /> : <MoonIcon />}
        {night ? 'Day' : 'Night'}
      </button>
    </div>
  );
}
