import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, Suspense } from 'react';
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

const ROAD_COLOR = new THREE.Color('#B84A18');
const WINDOW_COLOR = new THREE.Color('#4ABFB0');

function Building({ x, z, w, d, h }: { x: number; z: number; w: number; d: number; h: number }) {
  const winRows = Math.max(1, Math.floor(h / 0.75));
  return (
    <group position={[x, h / 2, z]}>
      {/* Main body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#f2ede8" roughness={0.55} metalness={0.08} />
      </mesh>
      {/* Rooftop accent */}
      <mesh position={[0, h / 2 + 0.04, 0]}>
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial color="#ddd8d2" roughness={0.7} />
      </mesh>
      {/* Teal window strips — front face */}
      {Array.from({ length: winRows }).map((_, i) => (
        <mesh
          key={i}
          position={[0, -h / 2 + 0.38 + i * 0.75, d / 2 + 0.015]}
        >
          <planeGeometry args={[w * 0.55, 0.18]} />
          <meshStandardMaterial
            color={WINDOW_COLOR}
            emissive={WINDOW_COLOR}
            emissiveIntensity={i % 3 === 1 ? 1.1 : 0.55}
            roughness={0.3}
          />
        </mesh>
      ))}
      {/* Side windows */}
      {Array.from({ length: winRows }).map((_, i) => (
        <mesh
          key={`s${i}`}
          position={[w / 2 + 0.015, -h / 2 + 0.38 + i * 0.75, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[d * 0.45, 0.15]} />
          <meshStandardMaterial
            color={WINDOW_COLOR}
            emissive={WINDOW_COLOR}
            emissiveIntensity={i % 3 === 0 ? 0.9 : 0.4}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function Ground() {
  return (
    <group>
      {/* Base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#C1521E" roughness={0.95} />
      </mesh>
      {/* Grid road lines */}
      {[-3, -1.5, 0, 1.5, 3].map((v) => (
        <group key={v}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[v, 0.005, 0]}>
            <planeGeometry args={[0.05, 14]} />
            <meshBasicMaterial color={ROAD_COLOR} opacity={0.5} transparent />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, v]}>
            <planeGeometry args={[14, 0.05]} />
            <meshBasicMaterial color={ROAD_COLOR} opacity={0.5} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CityGroup() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.22;
    }
  });

  return (
    <group ref={groupRef}>
      <Ground />
      {BUILDINGS.map((b, i) => (
        <Building key={i} {...b} />
      ))}
    </group>
  );
}

export default function HeroCity3D() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '296px',
        height: '164px',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow:
          '0 12px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)',
        background: '#C45020',
      }}
    >
      <Canvas
        camera={{ position: [5.5, 4.5, 5.5], fov: 48 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <color attach="background" args={['#C45020']} />
        <fog attach="fog" args={['#C45020', 9, 20]} />

        <ambientLight intensity={0.65} />
        <directionalLight
          position={[6, 9, 4]}
          intensity={1.3}
          castShadow
          shadow-mapSize={[512, 512]}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <pointLight position={[0, 7, 0]} intensity={0.6} color="#4ABFB0" />
        <pointLight position={[-3, 4, -3]} intensity={0.25} color="#F0A882" />

        <Suspense fallback={null}>
          <CityGroup />
        </Suspense>
      </Canvas>
    </div>
  );
}
