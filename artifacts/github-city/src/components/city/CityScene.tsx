import { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { CityData, BuildingData } from '../../types/github';
import Building from './Building';
import Ground from './Ground';
import Trees from './Trees';
import DowntownSkyline from './DowntownSkyline';
import Traffic from './Traffic';
import CityLife from './CityLife';
import { NIGHT_PALETTE, MARS_PALETTE } from '../../utils/colors';

interface CitySceneProps {
  cityData: CityData;
  nightMode: boolean;
  showSkyline: boolean;
  onSelectBuilding: (data: BuildingData | null) => void;
}

/* ── Lighting ───────────────────────────────────────────── */
function SceneLighting({ nightMode }: { nightMode: boolean }) {
  return (
    <>
      <ambientLight
        intensity={nightMode ? 0.35 : 0.55}
        color={nightMode ? '#b0c8e8' : '#fff0e0'}
      />
      {/* Key sun / moon */}
      <directionalLight
        position={[40, 60, 30]}
        intensity={nightMode ? 0.80 : 1.5}
        color={nightMode ? '#c8e0ff' : '#ffcf9e'}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      {/* Fill — opposite side */}
      <directionalLight
        position={[-25, 20, -20]}
        intensity={nightMode ? 0.30 : 0.35}
        color={nightMode ? '#7080cc' : '#ff9060'}
      />
      {/* Rim light */}
      <directionalLight
        position={[0, -8, -30]}
        intensity={nightMode ? 0.15 : 0.15}
        color={nightMode ? '#8899dd' : '#ffe8d0'}
      />

      {/* Night city glow */}
      {nightMode && (
        <>
          <pointLight position={[0, 18, 0]}    intensity={0.5}  color={NIGHT_PALETTE.neonPink}  />
          <pointLight position={[25,  8,  0]}   intensity={0.35} color={NIGHT_PALETTE.turquoise} />
          <pointLight position={[-25, 8,  0]}   intensity={0.30} color="#4060ff"                 />
          <pointLight position={[0,   4, 25]}   intensity={0.25} color={NIGHT_PALETTE.neonPink}  />
          <pointLight position={[0,   4, -25]}  intensity={0.25} color={NIGHT_PALETTE.turquoise} />
        </>
      )}
    </>
  );
}

/* ── Sky / fog ──────────────────────────────────────────── */
function SkyBackground({ nightMode }: { nightMode: boolean }) {
  const { scene } = useThree();
  const target = nightMode ? NIGHT_PALETTE.skyBase : MARS_PALETTE.skyDay;
  const fogTarget = nightMode ? NIGHT_PALETTE.skyBase : MARS_PALETTE.fogDay;
  const curBg = useRef(new THREE.Color(target));
  const curFog = useRef(new THREE.Color(fogTarget));

  useFrame((_, dt) => {
    const bg = new THREE.Color(target);
    const fg = new THREE.Color(fogTarget);
    curBg.current.lerp(bg, dt * 1.8);
    curFog.current.lerp(fg, dt * 1.8);
    (scene.background as THREE.Color)?.set(curBg.current);
    if (scene.fog) (scene.fog as THREE.Fog).color.set(curFog.current);
  });

  return null;
}

/* ── Animated buildings ─────────────────────────────────── */
function AnimatedBuildings({
  buildings, nightMode, onSelect,
}: {
  buildings: BuildingData[];
  nightMode: boolean;
  onSelect: (d: BuildingData) => void;
}) {
  const [progress, setProgress] = useState(0);
  const start = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - start.current) / 1800;
    setProgress(Math.min(elapsed, 1));
  });

  return (
    <>
      {buildings.map((b, i) => (
        <Building
          key={b.repo.name}
          data={b}
          nightMode={nightMode}
          onSelect={onSelect}
          animProgress={Math.max(0, Math.min(1, (progress - (i / buildings.length) * 0.4) * 2.5))}
        />
      ))}
    </>
  );
}

/* ── Skyline wrapper ────────────────────────────────────── */
function SkylineWrapper({ bars, nightMode }: { bars: CityData['skyline']; nightMode: boolean }) {
  const [progress, setProgress] = useState(0);
  const start = useRef(Date.now());
  useFrame(() => {
    const elapsed = (Date.now() - start.current) / 1500;
    setProgress(Math.min(elapsed, 1));
  });
  return <DowntownSkyline bars={bars} nightMode={nightMode} animProgress={progress} />;
}

/* ── Main export ────────────────────────────────────────── */
export default function CityScene({ cityData, nightMode, showSkyline, onSelectBuilding }: CitySceneProps) {
  const isMobile = window.innerWidth < 768;

  return (
    <Canvas
      shadows={!isMobile}
      camera={{ position: [38, 32, 38], fov: 48, near: 0.1, far: 500 }}
      gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
      style={{ background: nightMode ? NIGHT_PALETTE.skyBase : MARS_PALETTE.skyDay }}
    >
      <color attach="background" args={[nightMode ? NIGHT_PALETTE.skyBase : MARS_PALETTE.skyDay]} />
      <fog attach="fog" args={[nightMode ? NIGHT_PALETTE.skyBase : MARS_PALETTE.fogDay, 80, 220]} />

      <SkyBackground nightMode={nightMode} />
      <SceneLighting nightMode={nightMode} />

      {nightMode && (
        <Stars radius={100} depth={50} count={3000} factor={4} fade saturation={0.3} />
      )}

      <Suspense fallback={null}>
        <AnimatedBuildings
          buildings={cityData.buildings}
          nightMode={nightMode}
          onSelect={onSelectBuilding}
        />
        <Trees buildings={cityData.buildings} nightMode={nightMode} />
        {showSkyline && <SkylineWrapper bars={cityData.skyline} nightMode={nightMode} />}
        <Ground nightMode={nightMode} size={300} onClick={() => onSelectBuilding(null)} />
        <Traffic />
        <CityLife nightMode={nightMode} />
      </Suspense>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.5}
        minDistance={8}
        maxDistance={130}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </Canvas>
  );
}
