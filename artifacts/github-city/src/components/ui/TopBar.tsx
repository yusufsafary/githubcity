import { useState, FormEvent } from 'react';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface TopBarProps {
  onBuild: (username: string) => void;
  loading: boolean;
  hasCity: boolean;
  username: string;
  setUsername: (v: string) => void;
}

export default function TopBar({ onBuild, loading, hasCity, username, setUsername }: TopBarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!loading && username.trim()) onBuild(username.trim());
  };

  if (collapsed && hasCity) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-white/10"
        >
          <MapPin size={14} className="text-teal-400" />
          <span className="max-w-[140px] truncate">{username}</span>
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 pb-2">
      <div className="max-w-lg mx-auto bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={16} className="text-teal-400 shrink-0" />
          <span className="text-white font-bold text-sm tracking-wide">GitHub City</span>
          {hasCity && (
            <button onClick={() => setCollapsed(true)} className="ml-auto text-white/50 hover:text-white/80">
              <ChevronUp size={16} />
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="GitHub username…"
            className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10 focus:border-teal-400/50 min-h-[44px]"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="bg-teal-500 hover:bg-teal-400 disabled:bg-white/20 disabled:text-white/40 text-black font-bold rounded-xl px-4 py-2.5 text-sm transition-colors min-h-[44px] min-w-[90px] shrink-0"
          >
            {loading ? '…' : 'Build City'}
          </button>
        </form>
      </div>
    </div>
  );
}
