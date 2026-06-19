import { useMemo } from 'react';
import * as THREE from 'three';
import { NIGHT_PALETTE } from '../../utils/colors';

interface GroundProps {
  nightMode: boolean;
  size?: number;
}

function createAsphaltTexture(night: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = night ? '#0d0d1a' : '#2a2a2a';
  ctx.fillRect(0, 0, 512, 512);

  if (night) {
    ctx.strokeStyle = NIGHT_PALETTE.turquoise;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.beginPath(); ctx.moveTo(256, 0); ctx.lineTo(256, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 256); ctx.lineTo(512, 256); ctx.stroke();
    ctx.setLineDash([]);

    // Sidewalk
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 12;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, 512); ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

export default function Ground({ nightMode, size = 200 }: GroundProps) {
  const texture = useMemo(() => createAsphaltTexture(nightMode), [nightMode]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[size, size, 1, 1]} />
      <meshStandardMaterial
        map={texture}
        color={nightMode ? '#0a0a18' : '#333333'}
        roughness={0.95}
        metalness={nightMode ? 0.1 : 0}
        emissive={nightMode ? new THREE.Color(NIGHT_PALETTE.turquoise) : new THREE.Color(0)}
        emissiveIntensity={nightMode ? 0.04 : 0}
      />
    </mesh>
  );
}
