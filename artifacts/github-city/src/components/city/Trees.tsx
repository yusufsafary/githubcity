import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { BuildingData } from '../../types/github';

interface TreesProps {
  buildings: BuildingData[];
  nightMode: boolean;
}

export default function Trees({ buildings, nightMode }: TreesProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);

  const treePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (const b of buildings) {
      positions.push([b.x - b.width / 2 - 0.8, 0, b.z]);
      positions.push([b.x + b.width / 2 + 0.8, 0, b.z]);
    }
    return positions;
  }, [buildings]);

  useFrame(() => {
    if (!trunkRef.current || !leafRef.current) return;
    const dummy = new THREE.Object3D();
    treePositions.forEach(([x, , z], i) => {
      dummy.position.set(x, 0.4, z);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      trunkRef.current!.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, 1.1, z);
      dummy.updateMatrix();
      leafRef.current!.setMatrixAt(i, dummy.matrix);
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    leafRef.current.instanceMatrix.needsUpdate = true;
  });

  if (treePositions.length === 0) return null;

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, treePositions.length]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.8, 5]} />
        <meshStandardMaterial color={nightMode ? '#1a0d00' : '#5c3d1e'} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[undefined, undefined, treePositions.length]} castShadow>
        <coneGeometry args={[0.45, 1.0, 6]} />
        <meshStandardMaterial
          color={nightMode ? '#0d2a1a' : '#2d6a4f'}
          roughness={0.8}
          emissive={nightMode ? new THREE.Color(0x0a3320) : new THREE.Color(0)}
          emissiveIntensity={nightMode ? 0.3 : 0}
        />
      </instancedMesh>
    </>
  );
}
