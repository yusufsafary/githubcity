import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { CityData, BuildingData } from '../../types/github';
import Building from './Building';
import Ground from './Ground';
import Trees from './Trees';
import DowntownSkyline from './DowntownSkyline';
import { NIGHT_PALETTE, MARS_PALETTE } from '../../utils/colors';

interface CitySceneProps {
  cityData: CityData;
  nightMode: boolean;
  showSkyline: boolean;
  onSelectBuilding: (data: BuildingData | null) => void;
}

function SceneLighting({ nightMode }: { nightMode: boolean }) {
  return (
    <>
      <ambientLight
        intensity={nightMode ? 0.15 : 0.6}
        color={nightMode ? NIGHT_PALETTE.skyBase : '#fff0e0'}
      />
      <directionalLight
        position={[40, 60, 30]}
        intensity={nightMode ? 0.3 : 1.4}
        color={nightMode ? NIGHT_PALETTE.sunGlow : '#ffcf9e'}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <directionalLight
        position={[-20, 30, -20]}
        intensity={nightMode ? 0 : 0.3}
        color="#ffa060"
      />
      {nightMode && (
        <>
          <pointLight position={[0, 20, 0]} intensity={0.4} color={NIGHT_PALETTE.neonPink} />
          <pointLight position={[30, 10, 0]} intensity={0.3} color={NIGHT_PALETTE.turquoise} />
        </>
      )}
    </>
  );
}

function SkyBackground({ nightMode }: { nightMode: boolean }) {
  const { scene } = useThree();
  useEffect(() => {
    if (nightMode) {
      scene.background = new THREE.Color(NIGHT_PALETTE.skyBase);
      scene.fog = new THREE.FogExp2(NIGHT_PALETTE.skyBase, 0.012);
    } else {
      scene.background = new THREE.Color(MARS_PALETTE.skyDay);
      scene.fog = new THREE.FogExp2(MARS_PALETTE.fogDay, 0.013);
    }
  }, [nightMode, scene]);
  return null;
}

function AnimatedBuildings({
  buildings,
  nightMode,
  onSelect,
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

function SkylineWrapper({ bars, nightMode }: { bars: CityData['skyline']; nightMode: boolean }) {
  const [progress, setProgress] = useState(0);
  const start = useRef(Date.now());
  useFrame(() => {
    const elapsed = (Date.now() - start.current) / 1500;
    setProgress(Math.min(elapsed, 1));
  });
  return <DowntownSkyline bars={bars} nightMode={nightMode} animProgress={progress} />;
}

export default function CityScene({ cityData, nightMode, showSkyline, onSelectBuilding }: CitySceneProps) {
  const isMobile = window.innerWidth < 768;

  return (
    <Canvas
      shadows={!isMobile}
      camera={{ position: [35, 35, 35], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
      style={{ background: nightMode ? NIGHT_PALETTE.skyBase : MARS_PALETTE.skyDay }}
      onClick={() => onSelectBuilding(null)}
    >
      <SkyBackground nightMode={nightMode} />
      <SceneLighting nightMode={nightMode} />
      {nightMode && <Stars radius={100} depth={50} count={2000} factor={4} fade />}

      <Suspense fallback={null}>
        <AnimatedBuildings
          buildings={cityData.buildings}
          nightMode={nightMode}
          onSelect={onSelectBuilding}
        />
        <Trees buildings={cityData.buildings} nightMode={nightMode} />
        {showSkyline && <SkylineWrapper bars={cityData.skyline} nightMode={nightMode} />}
        <Ground nightMode={nightMode} size={300} />
      </Suspense>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={8}
        maxDistance={120}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </Canvas>
  );
}
