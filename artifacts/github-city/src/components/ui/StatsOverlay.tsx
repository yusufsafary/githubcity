import { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { getLanguageColor } from '../../utils/colors';

interface StatsOverlayProps {
  stats: {
    repoCount: number;
    totalCommits: number;
    topLanguage: string | null;
    totalStars: number;
  };
  username: string;
  nightMode: boolean;
}

export default function StatsOverlay({ stats, username, nightMode }: StatsOverlayProps) {
  const [open, setOpen] = useState(true);

  const panelBg = nightMode ? 'bg-[#0F0315]/85 border-white/10' : 'bg-[#1C0E06]/80 border-[#4ABFB0]/20';
  const text = 'text-white';
  const sub = nightMode ? 'text-white/50' : 'text-white/55';
  const divider = nightMode ? 'border-white/10' : 'border-white/15';

  return (
    <div className="fixed top-24 right-3 z-40 max-w-[200px]">
      <div className={`${panelBg} backdrop-blur-md rounded-2xl border shadow-lg overflow-hidden`}>
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-2 px-3 py-2.5 w-full min-h-[44px] ${text}`}
        >
          <BarChart2 size={14} className="text-[#4ABFB0] shrink-0" />
          <span className="text-xs font-semibold truncate flex-1 text-left">{username}</span>
          {open ? <ChevronUp size={12} className={sub} /> : <ChevronDown size={12} className={sub} />}
        </button>

        {open && (
          <div className={`px-3 pb-3 border-t ${divider}`}>
            <div className="space-y-2 pt-2">
              <StatRow label="Repos" value={stats.repoCount} sub={sub} text={text} />
              <StatRow label="Commits" value={stats.totalCommits} sub={sub} text={text} note="~90d" />
              <StatRow label="Stars" value={stats.totalStars} sub={sub} text={text} />
              {stats.topLanguage && (
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${sub}`}>Top lang</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getLanguageColor(stats.topLanguage) }}
                    />
                    <span className={`text-xs font-semibold ${text}`}>{stats.topLanguage}</span>
                  </div>
                </div>
              )}
            </div>
            <p className={`text-[10px] ${sub} mt-2 leading-tight`}>
              * Commit data covers ~90 days only
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({
  label, value, sub, text, note,
}: {
  label: string; value: number; sub: string; text: string; note?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${sub}`}>{label}</span>
      <div className="flex items-center gap-1">
        <span className={`text-xs font-bold ${text}`}>{value.toLocaleString()}</span>
        {note && <span className={`text-[10px] ${sub}`}>{note}</span>}
      </div>
    </div>
  );
}
