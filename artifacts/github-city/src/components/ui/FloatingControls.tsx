import { Moon, Sun, GitFork, Building2 } from 'lucide-react';

interface FloatingControlsProps {
  nightMode: boolean;
  onToggleNight: () => void;
  showForks: boolean;
  onToggleForks: (v: boolean) => void;
  showSkyline: boolean;
  onToggleSkyline: () => void;
}

export default function FloatingControls({
  nightMode, onToggleNight,
  showForks, onToggleForks,
  showSkyline, onToggleSkyline,
}: FloatingControlsProps) {
  const bg = nightMode ? 'bg-[#0f0f1e]/80' : 'bg-white/80';
  const border = nightMode ? 'border-white/10' : 'border-gray-200';

  return (
    <div className="fixed bottom-6 right-3 z-40 flex flex-col gap-2">
      <ToggleBtn
        active={nightMode}
        onClick={onToggleNight}
        bg={bg} border={border}
        icon={nightMode ? <Moon size={18} className="text-purple-400" /> : <Sun size={18} className="text-yellow-400" />}
        label={nightMode ? 'Day' : 'Night'}
        activeColor="bg-purple-600"
      />
      <ToggleBtn
        active={showForks}
        onClick={() => onToggleForks(!showForks)}
        bg={bg} border={border}
        icon={<GitFork size={16} className={showForks ? 'text-teal-400' : 'text-gray-400'} />}
        label="Forks"
        activeColor="bg-teal-600"
      />
      <ToggleBtn
        active={showSkyline}
        onClick={onToggleSkyline}
        bg={bg} border={border}
        icon={<Building2 size={16} className={showSkyline ? 'text-pink-400' : 'text-gray-400'} />}
        label="Skyline"
        activeColor="bg-pink-600"
      />
    </div>
  );
}

function ToggleBtn({
  active, onClick, bg, border, icon, label, activeColor,
}: {
  active: boolean; onClick: () => void;
  bg: string; border: string; icon: React.ReactNode;
  label: string; activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border ${border} ${active ? activeColor + ' text-white' : bg + ' text-gray-400'} backdrop-blur-md shadow-lg min-h-[44px] text-xs font-medium transition-colors`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
