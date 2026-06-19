import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useGitHubCity } from './hooks/useGitHubCity';
import type { BuildingData } from './types/github';
import CityScene from './components/city/CityScene';
import TopBar from './components/ui/TopBar';
import BottomSheet from './components/ui/BottomSheet';
import StatsOverlay from './components/ui/StatsOverlay';
import FloatingControls from './components/ui/FloatingControls';
import LoadingOverlay from './components/ui/LoadingOverlay';
import Leaderboard from './components/ui/Leaderboard';
import { AboutModal, HowToPlayModal } from './components/ui/InfoModals';
import { MARS_PALETTE, NIGHT_PALETTE } from './utils/colors';

const HeroCity3D = lazy(() => import('./components/city/HeroCity3D'));

const RESERVED_PATHS = new Set(['u', 'api', 'share', 'top', '']);

function useIsLandscape() {
  const check = useCallback(
    () => window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches,
    [],
  );
  const [land, setLand] = useState(check);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape) and (max-height: 520px)');
    const handler = () => setLand(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [check]);
  return land;
}

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
    resetCity,
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
    <div className="w-full overflow-hidden relative" style={{ background: skyColor, height: '100dvh' }}>
      {!hasCity && loading.step === 'idle' && (
        <LandingHero onShowLeaderboard={handleToggleLeaderboard} />
      )}

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
        onHome={resetCity}
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

function LandingHero({ onShowLeaderboard }: { onShowLeaderboard: () => void }) {
  const [showAbout, setShowAbout] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const landscape = useIsLandscape();

  return (
    <div className="absolute inset-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Suspense fallback={<div className="absolute inset-0" style={{ background: '#C45020' }} />}>
        <HeroCity3D />
      </Suspense>

      {/* Gradient overlay — stronger on mobile for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, transparent 28%)',
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(0,0,0,0.42) 0%, transparent 100%)',
          ].join(', '),
        }}
      />

      {landscape ? (
        /* ── Landscape phone: two-column compact layout ─────── */
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ paddingTop: 'max(52px, env(safe-area-inset-top))', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
        >
          {/* Left: logo + title */}
          <div className="flex flex-col items-center gap-1.5 pointer-events-auto mr-6">
            <GitCityLogo size={46} />
            <h1
              className="text-[1.55rem] font-bold text-white leading-tight drop-shadow-lg text-center"
              style={{ letterSpacing: '-0.025em', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
            >
              GitHub City
            </h1>
            <p
              className="text-white/75 text-[0.72rem] leading-snug font-light text-center"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)', maxWidth: '140px' }}
            >
              Your GitHub activity as a living 3D city
            </p>
          </div>
          {/* Right: buttons */}
          <div className="flex flex-col items-start gap-2 pointer-events-auto">
            <button
              onClick={onShowLeaderboard}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/25 bg-black/25 text-white/90 text-sm hover:bg-black/40 hover:text-white transition-all duration-200 backdrop-blur-sm"
            >
              <span className="text-base leading-none">🏆</span>
              <span className="font-medium">View Top Cities</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHowTo(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/55 hover:text-white/90 transition-colors"
                style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.14)' }}
              >
                <span className="text-[11px] leading-none">❓</span>
                How to use
              </button>
              <span className="text-white/20 text-xs select-none">·</span>
              <button
                onClick={() => setShowAbout(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/55 hover:text-white/90 transition-colors"
                style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.14)' }}
              >
                <span className="text-[11px] leading-none">ℹ️</span>
                About
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Portrait (default): vertical centered layout ───── */
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{
            paddingTop: 'max(80px, calc(56px + env(safe-area-inset-top)))',
            paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          <div className="gc-float gc-fade-up-1 mb-4 pointer-events-auto">
            <GitCityLogo size={68} />
          </div>

          <div className="gc-fade-up-2 text-center">
            <h1
              className="text-[2.1rem] font-bold text-white leading-tight drop-shadow-lg"
              style={{ letterSpacing: '-0.025em', textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}
            >
              GitHub City
            </h1>
            <div className="mx-auto mt-2 h-[2.5px] w-10 rounded-full bg-[#4ABFB0]" style={{ opacity: 0.9 }} />
          </div>

          <p
            className="gc-fade-up-3 mt-3 text-white/80 text-[0.9rem] leading-relaxed font-light text-center"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)', maxWidth: '210px' }}
          >
            Your GitHub activity,<br />rendered as a living 3D city
          </p>

          <button
            onClick={onShowLeaderboard}
            className="pointer-events-auto mt-7 flex items-center gap-2 px-4 py-2 rounded-full border border-white/25 bg-black/20 text-white/85 text-sm hover:bg-black/35 hover:text-white transition-all duration-200 backdrop-blur-sm"
            style={{ animation: 'gc-fade-up 0.6s ease-out 0.55s both' }}
          >
            <span className="text-base leading-none">🏆</span>
            <span className="font-medium">View Top Cities</span>
          </button>

          <div
            className="pointer-events-auto flex items-center gap-2 mt-3"
            style={{ animation: 'gc-fade-up 0.6s ease-out 0.70s both' }}
          >
            <button
              onClick={() => setShowHowTo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/55 hover:text-white/90 transition-colors"
              style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <span className="text-[11px] leading-none">❓</span>
              How to use
            </button>
            <span className="text-white/20 text-xs select-none">·</span>
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/55 hover:text-white/90 transition-colors"
              style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <span className="text-[11px] leading-none">ℹ️</span>
              About
            </button>
          </div>
        </div>
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
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
