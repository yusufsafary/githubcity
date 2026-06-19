import { useEffect, useRef } from 'react';
import { X, Star, GitFork, ExternalLink, Calendar, Code2 } from 'lucide-react';
import type { BuildingData } from '../../types/github';
import { getLanguageColor } from '../../utils/colors';

interface BottomSheetProps {
  building: BuildingData | null;
  onClose: () => void;
  nightMode: boolean;
}

export default function BottomSheet({ building, onClose, nightMode }: BottomSheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (building && ref.current) {
      ref.current.scrollTop = 0;
    }
  }, [building]);

  if (!building) return null;

  const { repo } = building;
  const langColor = getLanguageColor(repo.language);
  const created = new Date(repo.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

  const bg = nightMode ? 'bg-[#0f0f1e]/95' : 'bg-white/95';
  const text = nightMode ? 'text-white' : 'text-gray-900';
  const sub = nightMode ? 'text-white/50' : 'text-gray-500';
  const border = nightMode ? 'border-white/10' : 'border-gray-200';

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={ref}
        className={`relative w-full max-h-[60vh] overflow-y-auto pointer-events-auto ${bg} backdrop-blur-xl rounded-t-3xl border-t ${border} shadow-2xl`}
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${nightMode ? 'bg-white/20' : 'bg-gray-300'}`} />
        </div>

        <div className="px-5 pb-8 pt-2">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-3">
              <h2 className={`font-bold text-lg leading-tight truncate ${text}`}>{repo.name}</h2>
              {repo.description && (
                <p className={`text-sm mt-1 leading-relaxed ${sub}`}>{repo.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center ${nightMode ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500'}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Stats row */}
          <div className={`flex gap-4 py-3 border-y ${border} mb-4`}>
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-yellow-400" />
              <span className={`text-sm font-semibold ${text}`}>{repo.stargazers_count.toLocaleString()}</span>
              <span className={`text-xs ${sub}`}>stars</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GitFork size={14} className={sub} />
              <span className={`text-sm font-semibold ${text}`}>{repo.forks_count.toLocaleString()}</span>
              <span className={`text-xs ${sub}`}>forks</span>
            </div>
            {building.activity > 0 && (
              <div className="flex items-center gap-1.5">
                <Code2 size={14} className="text-teal-400" />
                <span className={`text-sm font-semibold ${text}`}>{building.activity}</span>
                <span className={`text-xs ${sub}`}>commits</span>
              </div>
            )}
          </div>

          {/* Language + date */}
          <div className="flex items-center gap-3 mb-5">
            {repo.language && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: langColor }} />
                <span className={`text-sm ${text}`}>{repo.language}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className={sub} />
              <span className={`text-xs ${sub}`}>Created {created}</span>
            </div>
          </div>

          {/* Building info */}
          <div className={`text-xs ${sub} mb-5 space-y-1`}>
            <div>Building height: {building.height.toFixed(1)} floors</div>
            {building.isLandmark && (
              <div className="text-yellow-400 font-medium">⭐ Landmark building</div>
            )}
            {repo.fork && (
              <div className={sub}>Forked repository</div>
            )}
          </div>

          {/* Open on GitHub */}
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-2xl text-sm transition-colors min-h-[48px]"
          >
            <ExternalLink size={15} />
            Open on GitHub
          </a>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
