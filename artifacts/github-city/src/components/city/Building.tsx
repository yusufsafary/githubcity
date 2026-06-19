import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BuildingData } from '../../types/github';
import { hashString } from '../../utils/colors';
import { NIGHT_PALETTE } from '../../utils/colors';

interface BuildingProps {
  data: BuildingData;
  nightMode: boolean;
  onSelect: (data: BuildingData) => void;
  animProgress: number;
}

function createWindowTexture(color: string, night: boolean): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  const rows = 8, cols = 5;
  const pw = size / cols, ph = size / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = Math.random() > 0.35;
      if (lit) {
        ctx.fillStyle = night ? `rgba(48,192,183,0.9)` : `rgba(255,240,180,0.85)`;
        ctx.fillRect(c * pw + 2, r * ph + 2, pw - 4, ph - 4);
      }
    }
  }
  return new THREE.CanvasTexture(canvas);
}

export default function Building({ data, nightMode, onSelect, animProgress }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const animHeight = data.height * Math.min(animProgress, 1);

  const texture = useMemo(
    () => createWindowTexture(data.color, nightMode),
    [data.color, nightMode]
  );

  const emissiveColor = useMemo(() => {
    if (!nightMode) return new THREE.Color(0x000000);
    const palette = [NIGHT_PALETTE.neonPink, NIGHT_PALETTE.turquoise, NIGHT_PALETTE.slateTeal];
    return new THREE.Color(palette[hashString(data.repo.name) % palette.length]);
  }, [nightMode, data.repo.name]);

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.04 : 1;
      meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.12;
      meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * 0.12;
    }
  });

  const yPos = animHeight / 2;

  return (
    <group position={[data.x, 0, data.z]}>
      <mesh
        ref={meshRef}
        position={[0, yPos, 0]}
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onSelect(data); }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[data.width, animHeight, data.depth]} />
        <meshStandardMaterial
          map={texture}
          color={nightMode ? '#1a1a2e' : data.color}
          emissive={emissiveColor}
          emissiveIntensity={nightMode ? 0.4 : 0}
          roughness={0.5}
          metalness={nightMode ? 0.6 : 0.2}
        />
      </mesh>

      {/* Landmark rooftop detail */}
      {data.isLandmark && animProgress > 0.8 && (
        <mesh position={[0, animHeight + 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 6]} />
          <meshStandardMaterial
            color={nightMode ? NIGHT_PALETTE.turquoise : '#aaaaaa'}
            emissive={nightMode ? new THREE.Color(NIGHT_PALETTE.turquoise) : new THREE.Color(0)}
            emissiveIntensity={nightMode ? 1 : 0}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* Park patch */}
      {data.hasPark && animProgress > 0.5 && (
        <mesh position={[data.width + 0.6, 0.05, 0]} receiveShadow>
          <boxGeometry args={[0.9, 0.1, 0.9]} />
          <meshStandardMaterial
            color={nightMode ? '#1a3a2a' : '#4a7c59'}
            roughness={0.9}
          />
        </mesh>
      )}
    </group>
  );
}
