import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BuildingData } from '../../types/github';
import { hashString, NIGHT_PALETTE, MARS_PALETTE } from '../../utils/colors';

interface BuildingProps {
  data: BuildingData;
  nightMode: boolean;
  onSelect: (data: BuildingData) => void;
  animProgress: number;
}

/* ── Material personality per building ─────────────────── */
const MAT_TYPES = ['glass', 'concrete', 'classic', 'warm', 'dark'] as const;
type MatType = typeof MAT_TYPES[number];
const MAT_PROPS: Record<MatType, { metal: number; rough: number }> = {
  glass:    { metal: 0.44, rough: 0.07 },
  concrete: { metal: 0.02, rough: 0.94 },
  classic:  { metal: 0.05, rough: 0.76 },
  warm:     { metal: 0.00, rough: 0.82 },
  dark:     { metal: 0.36, rough: 0.20 },
};

/* ── Canvas window texture ──────────────────────────────── */
function createWindowTexture(color: string, night: boolean, matType: MatType): THREE.CanvasTexture {
  const SZ = 256;
  const canvas = document.createElement('canvas');
  canvas.width = SZ; canvas.height = SZ;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, SZ, SZ);

  // Facade lines
  if (matType === 'glass' || matType === 'dark') {
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < SZ; x += SZ / 5) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SZ); ctx.stroke();
    }
  }
  if (matType === 'concrete' || matType === 'classic') {
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < SZ; y += SZ / 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SZ, y); ctx.stroke();
    }
  }

  // Window grid — tall proportioned windows (10 rows × 4 cols)
  const rows = 10, cols = 4;
  const padX = SZ * 0.07, padY = SZ * 0.05;
  const cellW = (SZ - padX * 2) / cols;
  const cellH = (SZ - padY * 2) / rows;
  const wW = cellW * 0.54, wH = cellH * 0.64;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = Math.random() > (night ? 0.28 : 0.50);
      const cx = padX + c * cellW + (cellW - wW) / 2;
      const cy = padY + r * cellH + (cellH - wH) / 2;
      if (night) {
        ctx.fillStyle = Math.random() > 0.38
          ? `rgba(255,200,120,${lit ? 0.88 : 0.10})`
          : `rgba(48,192,183,${lit ? 0.90 : 0.08})`;
      } else {
        ctx.fillStyle = matType === 'glass'
          ? `rgba(160,220,255,${lit ? 0.55 : 0.12})`
          : `rgba(255,210,150,${lit ? 0.58 : 0.08})`;
      }
      ctx.fillRect(cx, cy, wW, wH);
      if (lit) {
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cx, cy, wW, wH);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

/* ── Sub-components ─────────────────────────────────────── */
function Cornice({ w, d, yTop }: { w: number; d: number; yTop: number }) {
  return (
    <mesh position={[0, yTop + 0.055, 0]}>
      <boxGeometry args={[w + 0.07, 0.11, d + 0.07]} />
      <meshStandardMaterial color="#c0c0be" roughness={0.62} metalness={0.10} />
    </mesh>
  );
}

function Antenna({ yTop, nightMode }: { yTop: number; nightMode: boolean }) {
  const col = new THREE.Color(nightMode ? NIGHT_PALETTE.turquoise : MARS_PALETTE.domeGlass);
  return (
    <group position={[0, yTop + 0.05, 0]}>
      <mesh>
        <cylinderGeometry args={[0.038, 0.055, 1.25, 7]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.82} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <sphereGeometry args={[0.075, 10, 10]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={nightMode ? 2.6 : 0.65} />
      </mesh>
    </group>
  );
}

function WaterTower({ ox, oy, oz }: { ox: number; oy: number; oz: number }) {
  return (
    <group position={[ox, oy, oz]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.52, 10]} />
        <meshStandardMaterial color="#8a7a62" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.60, 0]}>
        <coneGeometry args={[0.20, 0.25, 10]} />
        <meshStandardMaterial color="#6a5c48" roughness={0.90} />
      </mesh>
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.11, 0.04, Math.sin(a) * 0.11]} rotation={[0, 0, 0.22]}>
            <cylinderGeometry args={[0.014, 0.014, 0.52, 4]} />
            <meshStandardMaterial color="#5a4c3a" roughness={0.92} />
          </mesh>
        );
      })}
    </group>
  );
}

function AcUnits({ bw, bh, bd }: { bw: number; bh: number; bd: number }) {
  const units = [[-bw * 0.20, bh + 0.04, bd * 0.18], [bw * 0.15, bh + 0.04, -bd * 0.15]];
  return (
    <>
      {units.map(([x, y, z], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <boxGeometry args={[0.18, 0.10, 0.14]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.72} metalness={0.18} />
        </mesh>
      ))}
    </>
  );
}

/* ── Main Building component ─────────────────────────────── */
export default function Building({ data, nightMode, onSelect, animProgress }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const hash = useMemo(() => hashString(data.repo.name), [data.repo.name]);
  const matType: MatType = MAT_TYPES[hash % MAT_TYPES.length];
  const mp = MAT_PROPS[matType];

  const texture = useMemo(
    () => createWindowTexture(data.color, nightMode, matType),
    [data.color, nightMode, matType],
  );

  const emissiveColor = useMemo(() => {
    if (!nightMode) return new THREE.Color(0x000000);
    const palette = [NIGHT_PALETTE.neonPink, NIGHT_PALETTE.turquoise, NIGHT_PALETTE.slateTeal];
    return new THREE.Color(palette[hash % palette.length]);
  }, [nightMode, hash]);

  useFrame(() => {
    if (!groupRef.current) return;
    const target = hovered ? 1.05 : 1.0;
    groupRef.current.scale.x += (target - groupRef.current.scale.x) * 0.12;
    groupRef.current.scale.z += (target - groupRef.current.scale.z) * 0.12;
  });

  const h = data.height * Math.min(animProgress, 1);
  const { width: bw, depth: bd } = data;

  const matStyle = {
    map: texture,
    color: nightMode ? new THREE.Color(data.color).multiplyScalar(0.28).getStyle() : data.color,
    emissive: emissiveColor,
    emissiveIntensity: nightMode ? 0.32 : 0,
    roughness: nightMode ? Math.max(0.05, mp.rough - 0.05) : mp.rough,
    metalness: nightMode ? mp.metal + 0.12 : mp.metal,
  } as const;

  const hasWaterTower = hash % 4 === 0 && h > 4 && animProgress > 0.88;
  const showAntenna = data.isLandmark && animProgress > 0.80;

  const events = {
    onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); onSelect(data); },
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
  };

  /* ── BOX ── */
  if (data.shape === 'box') {
    return (
      <group position={[data.x, 0, data.z]}>
        <group ref={groupRef} {...events}>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[bw, Math.max(h, 0.01), bd]} />
            <meshStandardMaterial {...matStyle} />
          </mesh>
          {h > 0.15 && <Cornice w={bw} d={bd} yTop={h / 2} />}
          {showAntenna && <Antenna yTop={h} nightMode={nightMode} />}
          {hasWaterTower && <WaterTower ox={bw * 0.28} oy={h} oz={bd * 0.28} />}
          {h > 2 && animProgress > 0.85 && <AcUnits bw={bw} bh={h} bd={bd} />}
          {data.hasPark && animProgress > 0.5 && (
            <mesh position={[bw + 0.65, 0.055, 0]} receiveShadow>
              <boxGeometry args={[1.0, 0.10, 1.0]} />
              <meshStandardMaterial color={nightMode ? '#1a3a2a' : MARS_PALETTE.greenPatch} roughness={0.9} />
            </mesh>
          )}
        </group>
      </group>
    );
  }

  /* ── PODIUM (setback crown) ── */
  if (data.shape === 'podium') {
    const baseH = h * 0.62;
    const crownH = h * 0.38;
    const cw = bw * 0.70, cd = bd * 0.70;
    return (
      <group position={[data.x, 0, data.z]}>
        <group ref={groupRef} {...events}>
          {/* Base */}
          <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[bw, Math.max(baseH, 0.01), bd]} />
            <meshStandardMaterial {...matStyle} />
          </mesh>
          {baseH > 0.15 && <Cornice w={bw} d={bd} yTop={baseH / 2} />}
          {/* Crown */}
          {crownH > 0.08 && (
            <>
              <mesh position={[0, baseH + crownH / 2, 0]} castShadow>
                <boxGeometry args={[cw, Math.max(crownH, 0.01), cd]} />
                <meshStandardMaterial {...matStyle}
                  metalness={Math.min(1, (matStyle.metalness as number) + 0.08)}
                  roughness={Math.max(0.02, (matStyle.roughness as number) - 0.06)} />
              </mesh>
              <Cornice w={cw} d={cd} yTop={baseH + crownH / 2} />
            </>
          )}
          {showAntenna && <Antenna yTop={h} nightMode={nightMode} />}
          {hasWaterTower && <WaterTower ox={bw * 0.28} oy={baseH} oz={bd * 0.28} />}
        </group>
      </group>
    );
  }

  /* ── L-SHAPE ── */
  // Main wing: full width, back 62% depth
  // Side wing: front-left 45% width × 38% depth, 78% height
  const mainD = bd * 0.62;
  const mainZ = (bd - mainD) / 2;
  const wingW = bw * 0.45;
  const wingD = bd * 0.38;
  const wingH = h * 0.78;
  const wingX = -(bw - wingW) / 2;
  const wingZ = -(bd - wingD) / 2;

  return (
    <group position={[data.x, 0, data.z]}>
      <group ref={groupRef} {...events}>
        {/* Main wing */}
        <mesh position={[0, h / 2, mainZ]} castShadow receiveShadow>
          <boxGeometry args={[bw, Math.max(h, 0.01), mainD]} />
          <meshStandardMaterial {...matStyle} />
        </mesh>
        {h > 0.15 && <Cornice w={bw} d={mainD} yTop={h / 2} />}
        {/* Side wing */}
        {wingH > 0.08 && (
          <>
            <mesh position={[wingX, wingH / 2, wingZ]} castShadow receiveShadow>
              <boxGeometry args={[wingW, Math.max(wingH, 0.01), wingD]} />
              <meshStandardMaterial {...matStyle} />
            </mesh>
            <Cornice w={wingW} d={wingD} yTop={wingH / 2} />
          </>
        )}
        {showAntenna && <Antenna yTop={h} nightMode={nightMode} />}
        {hasWaterTower && <WaterTower ox={bw * 0.28} oy={h * 0.62} oz={bd * 0.28} />}
      </group>
    </group>
  );
}
