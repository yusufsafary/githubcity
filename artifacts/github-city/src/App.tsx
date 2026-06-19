import { useState, useEffect, lazy, Suspense } from 'react';
import { useGitHubCity } from './hooks/useGitHubCity';
import type { BuildingData } from './types/github';
import CityScene from './components/city/CityScene';
import TopBar from './components/ui/TopBar';
import BottomSheet from './components/ui/BottomSheet';
import StatsOverlay from './components/ui/StatsOverlay';
import FloatingControls from './components/ui/FloatingControls';
import LoadingOverlay from './components/ui/LoadingOverlay';
import Leaderboard from './components/ui/Leaderboard';
import GitHubStats from './components/ui/GitHubStats';
import { MARS_PALETTE, NIGHT_PALETTE } from './utils/colors';

const HeroCity3D = lazy(() => import('./components/city/HeroCity3D'));

const RESERVED_PATHS = new Set(['u', 'api', 'share', 'top', '']);

function usernameFromPath(): string {
  const seg = window.location.pathname.slice(1).split('/')[0];
  if (!seg || RESERVED_PATHS.has(seg)) return '';
  return seg;
}

export default function App() {
  const {
    cityData, loading, buildCity,
    showForks, toggleForks,
    username, setUsername, lastUsername,
  } = useGitHubCity();

  const [nightMode, setNightMode] = useState(false);
  const [showSkyline, setShowSkyline] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(
    window.location.pathname === '/top'
  );

  const hasCity = cityData !== null && loading.step === 'done';
  const skyColor = nightMode ? NIGHT_PALETTE.skyBase : MARS_PALETTE.skyDay;

  useEffect(() => {
    if (window.location.pathname === '/top') return;
    const u = usernameFromPath();
    if (u) { setUsername(u); buildCity(u); }
  }, []);

  useEffect(() => {
    if (lastUsername && hasCity && !showLeaderboard) {
      const target = `/${lastUsername}`;
      if (window.location.pathname !== target) {
        window.history.pushState({}, '', target);
      }
    }
  }, [lastUsername, hasCity, showLeaderboard]);

  const handleLeaderboardSelect = (u: string) => {
    setShowLeaderboard(false);
    setUsername(u);
    buildCity(u);
    window.history.pushState({}, '', `/${u}`);
  };

  const handleToggleLeaderboard = () => {
    const next = !showLeaderboard;
    setShowLeaderboard(next);
    window.history.pushState({}, '', next ? '/top' : (lastUsername ? `/${lastUsername}` : '/'));
  };

  if (showLeaderboard) {
    return (
      <div className="w-full min-h-screen" style={{ background: skyColor }}>
        <Leaderboard
          nightMode={nightMode}
          onSelect={handleLeaderboardSelect}
          onBack={() => { setShowLeaderboard(false); window.history.pushState({}, '', lastUsername ? `/${lastUsername}` : '/'); }}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden relative" style={{ background: skyColor }}>
      {/* ── Idle landing: fullscreen 3D hero ── */}
      {!hasCity && loading.step === 'idle' && (
        <LandingHero onShowLeaderboard={handleToggleLeaderboard} />
      )}

      {/* ── Active city view ── */}
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

      <TopBar
        onBuild={buildCity}
        loading={loading.step !== 'idle' && loading.step !== 'done' && loading.step !== 'error'}
        hasCity={hasCity}
        username={username}
        setUsername={setUsername}
        nightMode={nightMode}
        lastUsername={lastUsername}
        onShowLeaderboard={handleToggleLeaderboard}
      />

      {hasCity && cityData && (
        <StatsOverlay stats={cityData.stats} username={lastUsername} nightMode={nightMode} />
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

      <BottomSheet building={selectedBuilding} onClose={() => setSelectedBuilding(null)} nightMode={nightMode} />
      <LoadingOverlay state={loading} nightMode={nightMode} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Landing hero — 3D city fills the whole screen,
   text + branding float as an overlay
───────────────────────────────────────────── */
function LandingHero({ onShowLeaderboard }: { onShowLeaderboard: () => void }) {
  return (
    <div className="absolute inset-0">
      {/* Fullscreen 3D city background */}
      <Suspense
        fallback={
          <div className="absolute inset-0" style={{ background: '#C45020' }} />
        }
      >
        <HeroCity3D />
      </Suspense>

      {/* Subtle dark gradient so text is always readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 22%)',
            'radial-gradient(ellipse 65% 55% at 50% 42%, rgba(0,0,0,0.38) 0%, transparent 100%)',
          ].join(', '),
        }}
      />

      {/* Text overlay — centered, below topbar */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ paddingTop: '80px' }}
      >
        {/* Logo */}
        <div className="gc-float gc-fade-up-1 mb-4 pointer-events-auto">
          <GitCityLogo size={68} />
        </div>

        {/* Title */}
        <div className="gc-fade-up-2 text-center">
          <h1
            className="text-[2.1rem] font-bold text-white leading-tight drop-shadow-lg"
            style={{ letterSpacing: '-0.025em', textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}
          >
            GitHub City
          </h1>
          <div className="mx-auto mt-2 h-[2.5px] w-10 rounded-full bg-[#4ABFB0]" style={{ opacity: 0.9 }} />
        </div>

        {/* Subtitle */}
        <p
          className="gc-fade-up-3 mt-3 text-white/80 text-[0.9rem] leading-relaxed font-light text-center"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)', maxWidth: '200px' }}
        >
          Your GitHub activity,<br />rendered as a living 3D city
        </p>

        {/* GitHub repo live stats */}
        <div
          className="pointer-events-auto mt-5"
          style={{ animation: 'gc-fade-up 0.6s ease-out 0.45s both' }}
        >
          <GitHubStats repo="yusufsafary/githubcity" />
        </div>

        {/* Leaderboard CTA */}
        <button
          onClick={onShowLeaderboard}
          className="pointer-events-auto mt-5 flex items-center gap-2 px-4 py-2 rounded-full border border-white/25 bg-black/20 text-white/85 text-sm hover:bg-black/35 hover:text-white transition-all duration-200 backdrop-blur-sm"
          style={{ animation: 'gc-fade-up 0.6s ease-out 0.65s both' }}
        >
          <span className="text-base leading-none">🏆</span>
          <span className="font-medium">View Top Cities</span>
        </button>
      </div>
    </div>
  );
}

export function GitCityLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="24" r="24" fill="#A8421A" />
      <circle cx="24" cy="24" r="24" fill="url(#grad-radial)" />
      <ellipse cx="24" cy="16" rx="14" ry="6" fill="#4ABFB0" opacity="0.12" />
      <rect x="6" y="35" width="36" height="1" fill="white" opacity="0.25" rx="0.5" />
      <rect x="7" y="28" width="6" height="7" fill="white" opacity="0.75" rx="0.5" />
      <rect x="8.5" y="29.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.7" />
      <rect x="8.5" y="32" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.45" />
      <rect x="14" y="22" width="7" height="13" fill="white" opacity="0.85" rx="0.5" />
      <rect x="15.2" y="23.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.8" />
      <rect x="18" y="23.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.5" />
      <rect x="15.2" y="26.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.55" />
      <rect x="18" y="26.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.8" />
      <rect x="15.2" y="29.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.4" />
      <rect x="22" y="14" width="8" height="21" fill="white" opacity="0.97" rx="0.5" />
      <rect x="25.5" y="10.5" width="1.5" height="3.5" fill="white" opacity="0.6" rx="0.5" />
      <circle cx="26.25" cy="10" r="1" fill="#4ABFB0" opacity="0.9" />
      <rect x="23.2" y="16" width="2" height="1.8" fill="#4ABFB0" opacity="0.85" />
      <rect x="26.2" y="16" width="2" height="1.8" fill="#4ABFB0" opacity="0.5" />
      <rect x="23.2" y="19.5" width="2" height="1.8" fill="#4ABFB0" opacity="0.65" />
      <rect x="26.2" y="19.5" width="2" height="1.8" fill="#4ABFB0" opacity="0.9" />
      <rect x="23.2" y="23" width="2" height="1.8" fill="#4ABFB0" opacity="0.4" />
      <rect x="26.2" y="23" width="2" height="1.8" fill="#4ABFB0" opacity="0.7" />
      <rect x="31" y="19" width="7" height="16" fill="white" opacity="0.85" rx="0.5" />
      <rect x="32.2" y="20.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.7" />
      <rect x="35.2" y="20.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.4" />
      <rect x="32.2" y="23.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.9" />
      <rect x="35.2" y="23.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.55" />
      <rect x="39" y="27" width="5" height="8" fill="white" opacity="0.7" rx="0.5" />
      <rect x="40" y="28.5" width="1.6" height="1.5" fill="#4ABFB0" opacity="0.65" />
      <defs>
        <radialGradient id="grad-radial" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#C1521E" />
          <stop offset="100%" stopColor="#8B3510" />
        </radialGradient>
      </defs>
    </svg>
  );
}
