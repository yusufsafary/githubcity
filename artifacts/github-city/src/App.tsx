import { useState } from 'react';
import { useGitHubCity } from './hooks/useGitHubCity';
import type { BuildingData } from './types/github';
import CityScene from './components/city/CityScene';
import TopBar from './components/ui/TopBar';
import BottomSheet from './components/ui/BottomSheet';
import StatsOverlay from './components/ui/StatsOverlay';
import FloatingControls from './components/ui/FloatingControls';
import LoadingOverlay from './components/ui/LoadingOverlay';

export default function App() {
  const {
    cityData, loading, buildCity,
    showForks, toggleForks,
    username, setUsername, lastUsername,
  } = useGitHubCity();

  const [nightMode, setNightMode] = useState(false);
  const [showSkyline, setShowSkyline] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);

  const hasCity = cityData !== null && loading.step === 'done';

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ background: nightMode ? '#0d0820' : '#87ceeb' }}
    >
      {/* 3D City */}
      {hasCity && cityData && (
        <div className="absolute inset-0">
          <CityScene
            cityData={cityData}
            nightMode={nightMode}
            showSkyline={showSkyline}
            onSelectBuilding={(b) => setSelectedBuilding(b)}
          />
        </div>
      )}

      {/* Empty state */}
      {!hasCity && loading.step === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-8 mt-24">
            <div className="text-6xl mb-4">🏙️</div>
            <h1 className="text-2xl font-bold text-white mb-2 drop-shadow">GitHub City</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              Enter a GitHub username above to generate<br />a 3D city from their public activity
            </p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <TopBar
        onBuild={buildCity}
        loading={loading.step !== 'idle' && loading.step !== 'done' && loading.step !== 'error'}
        hasCity={hasCity}
        username={username}
        setUsername={setUsername}
      />

      {/* Stats overlay */}
      {hasCity && cityData && (
        <StatsOverlay
          stats={cityData.stats}
          username={lastUsername}
          nightMode={nightMode}
        />
      )}

      {/* Floating controls */}
      {hasCity && (
        <FloatingControls
          nightMode={nightMode}
          onToggleNight={() => setNightMode(v => !v)}
          showForks={showForks}
          onToggleForks={toggleForks}
          showSkyline={showSkyline}
          onToggleSkyline={() => setShowSkyline(v => !v)}
        />
      )}

      {/* Bottom sheet */}
      <BottomSheet
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        nightMode={nightMode}
      />

      {/* Loading overlay */}
      <LoadingOverlay state={loading} nightMode={nightMode} />
    </div>
  );
}
