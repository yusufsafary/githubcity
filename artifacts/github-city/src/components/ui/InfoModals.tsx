import { useEffect } from 'react';

/* ── Shared backdrop + panel ─────────────────────────────── */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(8,4,18,0.78)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a0e06 0%, #0d0720 100%)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

/* ── About ───────────────────────────────────────────────── */
export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="px-7 pt-7 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #C45020, #8B3510)' }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <rect x="14" y="22" width="7" height="13" fill="white" opacity="0.9" rx="0.5" />
              <rect x="22" y="14" width="8" height="21" fill="white" rx="0.5" />
              <rect x="25.5" y="10.5" width="1.5" height="3.5" fill="white" opacity="0.6" rx="0.5" />
              <circle cx="26.25" cy="10" r="1" fill="#4ABFB0" />
              <rect x="31" y="19" width="7" height="16" fill="white" opacity="0.85" rx="0.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight tracking-tight">About GitHub City</h2>
            <p className="text-white/40 text-xs mt-0.5">A living 3D city built from your code</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 mb-5" />

        {/* Body */}
        <div className="space-y-4 text-white/70 text-sm leading-relaxed">
          <p>
            GitHub City turns your GitHub activity into a living, breathing 3D city. Every repository
            becomes a building, and the height reflects how active that project has been. The more
            commits and contributions, the taller the tower.
          </p>
          <p>
            The city comes alive with animated traffic, pedestrians, trees, street lamps, and traffic
            lights. Switch between day and night to see the skyline transform under a glowing neon sky.
          </p>
          <p>
            Share your city with anyone. Each profile gets its own URL so you can compare cities,
            show off your contributions, or just admire the view.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 my-5" />

        {/* Builder credit */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #4ABFB0, #2CA89A)' }}
          >
            K
          </div>
          <div>
            <p className="text-white/50 text-xs mb-0.5">Built by</p>
            <a
              href="https://x.com/Kevindicks_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4ABFB0] font-semibold text-sm hover:text-[#6DD4C8] transition-colors"
            >
              @Kevindicks_
            </a>
          </div>
          <a
            href="https://x.com/Kevindicks_"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/12 text-white/50 hover:text-white hover:border-white/25 transition-colors text-xs"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.857L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Follow
          </a>
        </div>
      </div>
    </Modal>
  );
}

/* ── How to Play ─────────────────────────────────────────── */
const STEPS = [
  {
    icon: '⌨️',
    title: 'Enter a GitHub username',
    desc: 'Type any GitHub username into the search bar at the top and hit Build City.',
  },
  {
    icon: '🏙️',
    title: 'Explore your city',
    desc: 'Your repos appear as buildings. Taller buildings mean more commits and activity on that project.',
  },
  {
    icon: '🖱️',
    title: 'Click any building',
    desc: 'Tap or click a building to see the repo name, language, star count, and recent commit activity.',
  },
  {
    icon: '🌙',
    title: 'Switch day and night',
    desc: 'Hit the Night button to transform your city into a glowing neon skyline with street lights and stars.',
  },
  {
    icon: '🔗',
    title: 'Share your city',
    desc: 'Use the Share button to copy a link. Anyone can open it to view your GitHub City instantly.',
  },
  {
    icon: '🏆',
    title: 'Check the leaderboard',
    desc: 'See which GitHub profiles have the most impressive cities by opening the Top Cities board.',
  },
];

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="px-7 pt-7 pb-8">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-white font-bold text-lg tracking-tight">How to use GitHub City</h2>
          <p className="text-white/40 text-xs mt-1">Everything you need to know in 60 seconds</p>
        </div>

        <div className="h-px bg-white/8 mb-5" />

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-3.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 mt-0.5"
                style={{ background: 'rgba(74,191,176,0.12)', border: '1px solid rgba(74,191,176,0.2)' }}
              >
                {step.icon}
              </div>
              <div>
                <p className="text-white/90 text-sm font-semibold leading-tight">{step.title}</p>
                <p className="text-white/50 text-xs leading-relaxed mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="h-px bg-white/8 mt-5 mb-4" />

        <p className="text-white/30 text-xs text-center leading-relaxed">
          Data is fetched live from the GitHub public API. No login required.
        </p>
      </div>
    </Modal>
  );
}
