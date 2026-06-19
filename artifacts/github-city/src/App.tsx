import { useState } from 'react';
import { useGitHubCity } from './hooks/useGitHubCity';
import type { BuildingData } from './types/github';
import CityScene from './components/city/CityScene';
import TopBar from './components/ui/TopBar';
import BottomSheet from './components/ui/BottomSheet';
import StatsOverlay from './components/ui/StatsOverlay';
import FloatingControls from './components/ui/FloatingControls';
import LoadingOverlay from './components/ui/LoadingOverlay';
import { MARS_PALETTE, NIGHT_PALETTE } from './utils/colors';

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
  const skyColor = nightMode ? NIGHT_PALETTE.skyBase : MARS_PALETTE.skyDay;

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ background: skyColor }}
    >
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

      {!hasCity && loading.step === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-8 mt-24">
            <GitCityLogo size={72} className="mx-auto mb-5 drop-shadow-lg" />
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow tracking-tight">
              GitHub City
            </h1>
            <p className="text-white/65 text-sm leading-relaxed">
              Enter a GitHub username above to generate<br />a 3D city from their public activity
            </p>
          </div>
        </div>
      )}

      <TopBar
        onBuild={buildCity}
        loading={loading.step !== 'idle' && loading.step !== 'done' && loading.step !== 'error'}
        hasCity={hasCity}
        username={username}
        setUsername={setUsername}
        nightMode={nightMode}
      />

      {hasCity && cityData && (
        <StatsOverlay
          stats={cityData.stats}
          username={lastUsername}
          nightMode={nightMode}
        />
      )}

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

      <BottomSheet
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        nightMode={nightMode}
      />

      <LoadingOverlay state={loading} nightMode={nightMode} />
    </div>
  );
}

function GitCityLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="#B84C1F" />
      <path d="M5 17 Q5.5 7 16 7 Q26.5 7 27 17Z" fill="#4ABFB0" opacity="0.22" />
      <path d="M5 17 Q5.5 7 16 7 Q26.5 7 27 17" stroke="#4ABFB0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <rect x="5" y="17" width="22" height="0.8" fill="white" opacity="0.45" />
      <rect x="8" y="13" width="3.5" height="4" fill="white" opacity="0.95" rx="0.4" />
      <rect x="14" y="10" width="4" height="7" fill="white" opacity="0.95" rx="0.4" />
      <rect x="20.5" y="14" width="3" height="3" fill="white" opacity="0.95" rx="0.4" />
      <circle cx="16" cy="22" r="1.4" fill="white" opacity="0.9" />
      <line x1="16" y1="23.4" x2="12.5" y2="26" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" />
      <line x1="16" y1="23.4" x2="19.5" y2="26" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" />
      <circle cx="12.5" cy="26.8" r="1.2" fill="white" opacity="0.85" />
      <circle cx="19.5" cy="26.8" r="1.2" fill="white" opacity="0.85" />
    </svg>
  );
}
